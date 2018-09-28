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
import { now } from '../utils';
import { SecToken2Doc } from 'flux-lib/types/db/authSecToken2'
import { findOneOr } from 'flux-lib/utils/db'


export const calcKey = (cacheRawKey: string) => sha256(decodeUTF8(cacheRawKey))

const UNK_AUTH = `Unknown authentication token`

export default class DBAuthSecToken2 {
    constructor(public dbv1: DBV1, public dbv2: DBV2, private db: DBMethods) {}

    async getUser(s2: string): PromE<UserV1Object> {
        const hashedS = encodeBase64(sha256(decodeUTF8(s2)))
        const stDocE = await findOneOr(this.dbv1.secToken2, {hashedS}, {}, UNK_AUTH)
        return await TE.fromEither(stDocE)
            .chain(({uid}) => TE.tryCatch(() => this.db.getUserFromUid(uid), () => UNK_AUTH))
            .run()
    }
}
