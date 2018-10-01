import { base64ToUint8a, uint8aToBase64, strToUint8a } from './index'
import sha256 from 'fast-sha256'
import { uint8aToBase32, base32ToUint8a } from './base32';
import { ObjectID } from 'bson';
import { TokenNamespaces } from '../types/db/oneTimeTokens';


export const hashBase64 = (b64Str: string): string =>
    uint8aToBase64(sha256(base64ToUint8a(b64Str)))

export const hashBase32 = (b32Str: string): string =>
    uint8aToBase32(sha256(base32ToUint8a(b32Str)))

export const hashV1 = sha256

// one-time-token hash
export const calcOTTHash = (uid: ObjectID, namespace: TokenNamespaces, tokenB32: string): Uint8Array =>
    sha256(strToUint8a(uid.toHexString() + namespace + tokenB32))
