import { init as initDb, DB } from '../db';
import * as R from 'ramda';
import { ObjectID } from 'bson';
import * as LineGraph from '../graphs/line'
import { writeFileSync } from 'fs';

const getAllRevocations = async (db: DB) =>
    await db.get_logs({action: 'deleted_user'})

const prepRevocationGraph = async (db: DB) => {
    const rs = await getAllRevocations(db)
    const dates = R.map(({_id}: {_id: ObjectID}) => _id.getTimestamp(), rs)
    const sortedDates = R.sortBy(d => d.getTime(), dates)
    const pairs = R.map(([nStr, d]) => ({x: d, y: parseInt(nStr) + 1, c: 0}), R.toPairs(sortedDates))
    console.log(pairs)
    return pairs
}

const main = async () => {
    const db = await initDb()
    const revocationData = await prepRevocationGraph(db).catch(e => console.log(e))
    const svg = LineGraph.toSvg(revocationData)
    writeFileSync('./tmp.svg', svg)
    await db.close()
}

main()