import { Collection, IndexOptions } from 'mongodb';
import { _Auth } from 'flux-lib/types/db';
import { DB } from './../db';
import { fluxHandler } from '../handlers/_stdWrapper'
const R = require('ramda')
import * as t from 'io-ts'


const mkIx = async <K, T extends Object>(c: Collection<T>, ixSpec: {[K in keyof T]?: number}, opts: IndexOptions = {}) => {
    return await c.createIndex(ixSpec, { ...opts, background: true })
}


export const updateIndexesDBV1 = (event, context) =>
    fluxHandler({
        auth: _Auth.None(),
        inType: t.any,
        outType: t.void
    }, async (db, {}, event, context) => {
        // secToken2
        await mkIx(db.dbv1.secToken2, {uid: 1, hashedS: 1})
        await mkIx(db.dbv1.secToken2, {hashedS: 1}, {unique: true})

        // caches
        await mkIx(db.dbv1.cache, { namespace: 1, key: 1 }, {unique: true})
    })

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
