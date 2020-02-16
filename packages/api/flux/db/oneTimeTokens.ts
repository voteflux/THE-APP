import { ObjectID } from 'bson';
import { DBMethods, _notExists } from './../db';
import { DBV1, DBV2, UserV1Object } from 'flux-lib/types/db';
import { PromE } from 'flux-lib/types'
import sha256 from "fast-sha256";
import { left, right, Either, Left, Right, either, fromNullable } from 'fp-ts/lib/Either'
import { _set, _lt } from '../db'
import { findOneOr } from 'flux-lib/utils/db'
import { uint8aToBase64, base64ToUint8a } from 'flux-lib/utils/index'
import { TokenNamespaces, OneTimeTokenDoc } from 'flux-lib/types/db/oneTimeTokens'
import { ReqReceipt } from 'flux-lib/types/db/auth'
import { hashBase64, calcOTTHash } from 'flux-lib/utils/crypto'
import * as utils from '../utils'


/**
 * One time tokens are stored all in one collection and have a few properties:
 * - user id
 * - namespace (used to help isolate tokens of different types)
 * - creationTs and expiry (timestamps for when it was created and the time it expires / used before)
 * - tokenHash - the hash of the token itself (we don't store the token in plaintext)
 * - redeemInfo - if this exists it means the token has been redeemed
 *
 * It's important that, when redeeming a token, all properties possible are validated.
 * - tokens should only be usable for a short while (default: 60 min)
 * - namespace, uid, and tokenHash matches
 * - redeemInfo does NOT exist
 */



// const DAYS_30 = 60 * 60 * 24 * 30
const MINUTES_60 = 60 * 60


export default class DBOneTimeTokens {
    constructor(public dbv1: DBV1, public dbv2: DBV2, private db: DBMethods) {}


    async addNewOneTimeToken(
        uid: ObjectID,
        namespace: TokenNamespaces,
        ttl: number = MINUTES_60,
        nBytes: number = 16
    ): PromE<{token: string}> {
        const token = utils.genBytesAsB32(nBytes)
        const tokenHash = uint8aToBase64(calcOTTHash(uid, namespace, token))

        const creationTs = utils.now()
        const expiry = creationTs + ttl

        const doc: OneTimeTokenDoc = {
            namespace,
            tokenHash,
            creationTs,
            expiry,
            uid,
        }

        return left(`unimplemented addNewOneTimeToken`)
        // const _r = await this.dbv1.oneTimeTokens.insertOne(doc)
        //
        // if (_r.result.ok !== 1)
        //     return left(`Unable to create one-time-token`)
        //
        // return right({token})
    }


    async redeemOneTimeToken(uid: ObjectID, namespace: TokenNamespaces, token: string, receipt: ReqReceipt): PromE<boolean> {
        const tokenHash = uint8aToBase64(calcOTTHash(uid, namespace, token))
        const ts = utils.now()

        const _r = await this.dbv1.oneTimeTokens.findOneAndUpdate(
            { tokenHash, redeemInfo: _notExists, namespace, uid, expiry: _lt(ts) },
            _set({ redeemInfo: { ts, receipt } })
        )

        if (_r.ok !== 1)
            return left(`Unable to redeem one-time-token`)

        return right(true)
    }
}
