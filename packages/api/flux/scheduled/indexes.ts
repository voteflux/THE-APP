import { Collection, IndexOptions } from 'mongodb';
import { _Auth } from 'flux-lib/types/db';
import {init as dbInit} from './../db';
// import { fluxHandler } from '../handlers/_stdWrapper'
// import * as R from 'ramda'
// import * as t from 'io-ts'
import { j } from '../utils'


const mkIx = async <K, T extends Object>(c: Collection<T>, ixSpec: {[K in keyof T]?: number}, opts: IndexOptions = {}) => {
    console.log(`Setting index ${j(ixSpec)} w/ options ${j(opts)} for collection ${c.namespace}`)
    return await c.createIndex(ixSpec, { ...opts, background: true })
}


export const updateIndexesDBV1 = async (event, context) => {
    const db = await dbInit()

    // secToken2
    await mkIx(db.dbv1.secToken2, {uid: 1, hashedS: 1})
    await mkIx(db.dbv1.secToken2, {hashedS: 1}, {unique: true})

    // caches
    await mkIx(db.dbv1.cache, { namespace: 1, key: 1 }, {unique: true})

    console.log("Updated indexes.")
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
// module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
