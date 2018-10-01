import { hashBase64 } from 'flux-lib/utils/crypto';
import { ObjectID } from 'bson';
import { DBMethods } from './../db';
import { DBV1, DBV2, UserV1Object } from 'flux-lib/types/db';
import { PromE } from 'flux-lib/types'
import sha256 from "fast-sha256";
import { left, right, Either, Left, Right, either, fromNullable } from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import {encodeBase64, decodeBase64, decodeUTF8} from 'tweetnacl-util';
import { promiseToEither } from 'flux-lib/utils/either';
import { _set } from '../db';
import * as R from 'ramda';
import { now, genBytesAsB64 } from '../utils';
import { SecToken2Doc, SecToken2Receipt, SecToken2List } from 'flux-lib/types/db/authSecToken2'
import { findOneOr } from 'flux-lib/utils/db'
import { randomBytes } from 'crypto';
import { uint8aToBase64, base64ToUint8a } from 'flux-lib/utils/index'
import { TokenNamespaces } from 'flux-lib/types/db/oneTimeTokens'
import * as utils from '../utils'


export const calcKey = (cacheRawKey: string) => sha256(decodeUTF8(cacheRawKey))

const UNK_AUTH = `Unknown authentication token`

const DAYS_30 = 60 * 60 * 24 * 30

export default class DBAuthSecToken2 {
    constructor(public dbv1: DBV1, public dbv2: DBV2, private db: DBMethods) {}


    async getUser(s2: string): PromE<UserV1Object> {
        const hashedS = hashBase64(s2)
        const stDocE = await findOneOr(this.dbv1.secToken2, {hashedS}, {}, UNK_AUTH)
        return await TE.fromEither(stDocE)
            .chain(({uid}) => TE.tryCatch(() => this.db.getUserFromUid(uid), () => UNK_AUTH))
            .run()
    }


    async addNewSecToken2(uid: ObjectID, ttl: number = DAYS_30, name?: string): PromE<SecToken2Receipt> {
        const secToken = utils.genBytesAsB64(20)
        const hashedS = hashBase64(secToken)
        const createdTs = utils.now()
        const expiry = createdTs + ttl

        const newSecToken: SecToken2Doc = {
            uid,
            hashedS,
            createdTs,
            expiry,
            revoked: false,
            name
        }

        const _r = await this.dbv1.secToken2.insertOne(newSecToken)
        if (_r.result.ok !== 1)
            return left(`Adding auth token to database failed :(`)

        return right({secToken, stid: _r.insertedId})
    }


    async listSecToken2s(uid: ObjectID): PromE<SecToken2List> {
        const tokens = await this.dbv1.secToken2.find({ uid }).toArray()
        return right(R.map(({ createdTs, expiry, name, revoked }) => ({ createdTs, expiry, name, revoked }), tokens))
    }
}
