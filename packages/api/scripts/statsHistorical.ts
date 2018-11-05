import * as yargs from 'yargs'
import * as R from 'ramda'

import { DB, init as initDb } from '../flux/db';
import { ObjectID } from 'bson';
import { getAllRevocations } from '../flux/stats/revocations'

const S3 = require('aws-sdk/clients/s3')
const s3 = new S3()


const __MinSafeIntStr__ = Number.MIN_SAFE_INTEGER.toString()


const args = yargs.option('target', {
    describe: 'the stat for which historical measures should be generated',
    type: 'string',
    required: true
}).option('endTs', {
    describe: 'the end timestamp (unix) for processing. Default: current time',
    type: 'number',
    required: false,
    default: ((new Date()).getTime()/1000|0).toString()
}).option('dryRun', {
    describe: 'whether we should produce changes or just print them',
    default: false,
    boolean: true
}).help().argv


const tsToFormattedDate = (ts: number): string => (new Date(ts * 1000)).toISOString().slice(0,10)


const revocations = async (revocations: {_id: ObjectID, action: string, data: any}[]) => {
    console.log("nRevocations total:", revocations.length)

    const timestamps = R.map(({_id}) => _id.generationTime, revocations)

    const endTs = args.endTs // parseInt(args.endTs)

    console.log("Timestamps:", timestamps)
    const minTs = <number>R.reduce(R.min, endTs, timestamps) - 86400
    const maxTs = <number>R.reduce(R.max, endTs, timestamps); // endTs

    if (maxTs <= minTs) {
        console.log("No timestamps to scan...", {minTs, maxTs})
        return
    }

    console.log('start', minTs, 'end', maxTs)

    const d = {
        start: new Date(minTs * 1000),
        end: new Date(maxTs * 1000)
    }

    d.start.setHours(12)
    d.start.setMinutes(0)
    d.start.setSeconds(0)

    console.log(d)

    const nDays = R.max(0, Math.ceil((maxTs - minTs) / 60 / 60 / 24))

    // the timestamps we'll sample against
    const sampleTss = R.map(dayN => minTs + dayN * (60 * 60 * 24), R.range(0, nDays + 1))

    const stats = R.fromPairs(R.map((beforeTs) => <[string, any]>[tsToFormattedDate(beforeTs), {
        nRevocations: R.filter(l => l._id.generationTime < beforeTs, revocations).length,
        ts: beforeTs
    }], sampleTss))

    console.log(stats)

    if (!args.dryRun) {
        const proms = R.values(R.mapObjIndexed(({ nRevocations, ts }, dStr) => s3.putObject({
            Body: JSON.stringify({ nRevocations, ts }),
            Bucket: process.env.STATS_S3_BUCKET,
            ContentType: 'application/json',
            Key: `${dStr}/revocations` }).promise().then(() => console.log(`Done: ${dStr}`)), stats))
        await Promise.all(proms)
    }
}


const targets = {
    revocations,
}


const main = async() => {
    console.log("Started main...")

    const db = await initDb()
    console.log("Created db...")

    const allLogs = await getAllRevocations(db)
    console.log("Got all logs...")

    await targets[args.target](allLogs).catch(e => console.error(`Error running target=${args.target}:`, e))
    await db.close()
    console.log("Main completed successfully")
}

main().then(() => console.log("Completed successfully")).catch(e => console.error("Fatal error:", e))
