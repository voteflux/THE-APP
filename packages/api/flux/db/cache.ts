import { DBV1, DBV2 } from 'flux-lib/types/db';
import { CacheDoc } from 'flux-lib/types/db/cache'
import { PromE } from 'flux-lib/types'
import sha256 from "fast-sha256";
import { left, right, Either, Left, Right } from 'fp-ts/lib/Either';
import {encodeBase64, decodeBase64, decodeUTF8} from 'tweetnacl-util';
import { promiseToEither } from 'flux-lib/utils/either';
import { _set } from '../db';
import * as R from 'ramda';
import { now } from '../utils';

export const calcKey = (cacheRawKey: string) => sha256(decodeUTF8(cacheRawKey))

const DEFAULT_EXPIRE = 60 * 60 * 24 * 60  // 2 months


export default class DBCheckCache {
    constructor(public dbv1: DBV1, public dbv2: DBV2) {
    }

    async check<T>(namespace: string, cacheRawKey: string): PromE<T> {
        const key = calcKey(cacheRawKey)
        const prom = this.dbv1.cache.findOne({ key, namespace })
        return (await promiseToEither(prom)).chain(r => {
            if (r === null)
                return(left(`Cannot find cached (${namespace}.${key})`))
            return right(r).map(({data}) => data) as Either<string, T>
        })
    }

    async insert<R>(namespace: string, cacheRawKey: string, data: R, expire_in_s = DEFAULT_EXPIRE) {
        const key = calcKey(cacheRawKey)
        return await this.dbv1.cache.updateOne({namespace, key}, _set({namespace, key, data, expire: now() + expire_in_s}), {upsert: true})
    }
}
