import { init as initDb, DB } from '../db';
import * as R from 'ramda';
import { ObjectID } from 'bson';
import * as LineGraph from '../graphs/line'
import { writeFileSync } from 'fs';

const S3 = require('aws-sdk/clients/s3')


export const getAllRevocations = async (db: DB) =>
    R.filter(d => !(<string>d.data.email).includes('xk.io'), await db.get_logs({action: 'deleted_user', 'data.onAECRoll': true}))

const revocationGraphData = async (db: DB, revocations?) => {
    const rs = revocations ? revocations : await getAllRevocations(db)
    // console.log(R.map(d => d.data.email, rs))
    const dates = R.map(d => d._id.getTimestamp(), rs)
    const sortedDates = R.sortBy(d => d.getTime(), dates)
    const pairs = R.map(([nStr, d]) => ({c: 0, x: d, y: parseInt(nStr) + 1}), R.toPairs(sortedDates))
    return pairs
}

export const dailyStats = async (db: DB) => {
    const s3 = new S3()
    const d = new Date()
    const ts = d.getTime() / 1000 | 0
    const dStr = d.toISOString().slice(0,10)

    const allRevocations = await getAllRevocations(db)
    const nRevocations = allRevocations.length
    const nRevParams = {
        Body: JSON.stringify({ nRevocations, ts }),
        Bucket: process.env.STATS_S3_BUCKET,
        ContentType: 'application/json'
    }

    const revocationData = R.map(({x,y,c}) => ({Date: x, N: y, c}), await revocationGraphData(db, allRevocations))
    const svg = await LineGraph.toSvg({
        name: "Revocations (Cumulative)",
        values: revocationData,
        // format: {parse: {"y": "number", "x": "date:\"%d-%b-%y\"", "c": "number"}}
    }, {x: "Date", y: "N"}, "Revocations by Date")

    const name = 'revocations'
    const uploads = [
        s3.putObject({ ...nRevParams, Key: `${dStr}/${name}` }).promise(),
        s3.putObject({ ...nRevParams, Key: `latest/${name}` }).promise(),
        s3.putObject({ ...nRevParams, ContentType: 'image/svg+xml', Body: svg, Key: `graphs/${name}.svg` }).promise(),
    ]

    await Promise.all(uploads)

    return {
        ...nRevParams
    }
}

// const main = async () => {
//     console.log('started main')
//     const db = await initDb()
//     console.log('got db')
//     try {
//         await dailyStats(db)
//     } catch (e) {
//         console.error(e)
//     }
//     await db.close()
// }
