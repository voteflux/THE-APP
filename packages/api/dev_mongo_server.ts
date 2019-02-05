console.log('started dev_mongo_server')

import MongodbMemoryServer from 'mongodb-memory-server';
// import { MongoClient } from 'mongodb'
import restore from 'mongodb-restore'

console.log('imported monogodb memory server && mongodb restore')

import DB from './flux/db'

let port = 53799

console.log("creating mongo memory server")
const mongod = new MongodbMemoryServer({instance: {port, dbName: "flux"}, debug: true});
console.log('created monogo memory server')

async function main() {
    const uri = await mongod.getConnectionString()
    console.log("DB URI:", uri)
    const db = await DB.init({}, uri)
    const {client, rawDb} = db.dbv1
    // always refresh for the moment
    if ((await rawDb.collections()).length < 5 || true) {
        // then we need to populate it
        console.log("loading saved db")
        await new Promise((res, rej) => restore({uri, drop: true, root: __dirname + "/dev-mongo-data/flux", callback: (e,v) => e ? rej(e) : res(v)}));
    }
    console.log("Mongo server ready!")
}

main()

process.on('SIGINT', () => {
    process.exit(0)
})
