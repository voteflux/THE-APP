import MongodbMemoryServer from 'mongodb-memory-server';
import { MongoClient } from 'mongodb'
import restore from 'mongodb-restore'

import DB from './flux-ts/db'

let port = 53799

const mongod = new MongodbMemoryServer({instance: {port, dbName: "flux", debug: true}});

async function main() {
    const uri = await mongod.getConnectionString()
    console.log("DB URI:", uri)
    const db = await DB.init({}, uri)
    const {client, rawDb} = db.dbv1
    if ((await rawDb.collections()).length < 5) {
        // then we need to populate it
        console.log("loading saved db")
        await new Promise((res, rej) => restore({uri, root: __dirname + "/dev-mongo-data/flux", callback: (e,v) => e ? rej(e) : res(v)}));
    }
    console.log("Mongo server ready!")
}

main()

process.on('SIGINT', () => {
    process.exit(0)
})
