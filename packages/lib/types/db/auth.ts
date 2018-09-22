import * as t from 'io-ts'
import * as R from 'ramda'
import sha256 from 'fast-sha256';
import nacl from 'tweetnacl'

import { HashRT } from './data'
import { concatUint8a, u8Eq, base64ToUint8a, uint8aToBase64, strToUint8a, uint8aToStr } from '../../utils'
import { Either } from 'fp-ts/lib/Either';


/**
 * AUTHENTICATION DETAILS (2.0)
 *
 * Valid messages are _signed_ using an Ed25519 keypair.
 * The associate public key is authorized via a JWT token.
 *
 * Two types of signed messages:
 * - No aux (just payload)
 * - With aux (aux fields are not recorded, but their hashes are)
 *
 * Message format (for signing)
 * [16 bytes: nonce]
 * [4 bytes: length of auxHash (M bytes)]
 * [M bytes: auxHash]
 * [4 bytes: length of payload (N bytes)]
 * [N bytes: payload]
 *
 *
 */


const uint32ToUint8a = (len: number) => {
    const ab = new ArrayBuffer(4)
    const dv = new DataView(ab)
    dv.setUint32(0, len)
    return new Uint8Array(ab)
}

const padTo4B = (len: number) => {
    const paddingNeeded = (mod => mod === 0 ? 0 : 4 - mod)(len % 4)
    const xs = new Uint8Array(paddingNeeded)
    xs.fill(0)
    return xs
}


// AUTH Stuff

const c = (x: any) => {
    console.log(x)
    return x
}

const PubKeyBase64RT = t.refinement(t.string, s => base64ToUint8a(s).length === 32)
const EcSigBase64RT = t.refinement(t.string, s => base64ToUint8a(s).length === 64)
const NonceBase64RT = t.refinement(t.string, s => base64ToUint8a(s).length === 16)

export const PayloadRT = t.array(t.tuple([t.string, t.any]))
export type Payload = t.TypeOf<typeof PayloadRT>

const SignedAuxPartRT = t.partial({ auxHash: HashRT, aux: PayloadRT })
type SignedAuxPart = t.TypeOf<typeof SignedAuxPartRT>


export const SignedReqNoValidationRT = t.intersection([
    t.type({
        payload: PayloadRT,
        ecSig: EcSigBase64RT,
        publicKey: PubKeyBase64RT,
        nonce: NonceBase64RT,
    }),
    SignedAuxPartRT
])
export type SignedReqNoValidation = t.TypeOf<typeof SignedReqNoValidationRT>


type SignedReqParamd<Ty extends string | Uint8Array> = {nonce: Ty, publicKey: Ty, ecSig: Ty} & Partial<{ auxHash: Ty }> & (Ty extends string ? {payload: Payload, aux?: Payload} : {szPayload: Uint8Array, aux?: Uint8Array})


export const convertBase64SignedReq = (opts: SignedReqParamd<string>): SignedReqParamd<Uint8Array> => {
    const ret: SignedReqParamd<Uint8Array> = {
        nonce: base64ToUint8a(opts.nonce),
        publicKey: base64ToUint8a(opts.publicKey),
        ecSig: base64ToUint8a(opts.ecSig),
        szPayload: _szPayload(opts.payload)
    }
    if (opts.auxHash !== undefined)
        ret.auxHash = base64ToUint8a(opts.auxHash)
    if (opts.aux)
        ret.aux = _szPayload(opts.aux)
    return ret
}

export const convertUint8aSignedReq = (opts: SignedReqParamd<Uint8Array>): SignedReqParamd<string> => {
    const ret = {
        nonce: uint8aToBase64(opts.nonce),
        publicKey: uint8aToBase64(opts.publicKey),
        ecSig: uint8aToBase64(opts.ecSig),
        payload: _unszPayload(opts.szPayload)
    } as SignedReqParamd<string>
    if (opts.auxHash)
        ret.auxHash = uint8aToBase64(opts.auxHash)
    if (opts.aux)
        ret.aux = _unszPayload(opts.aux)
    return ret
}



type MinMsgForPacking = {nonce: Uint8Array, szPayload: Uint8Array, auxHash?: Uint8Array}
export type ReadyToValidatedSignedReq = {publicKey: Uint8Array, ecSig: Uint8Array, aux?: Uint8Array} & MinMsgForPacking



export const mkPackedMsgForSigning = (opts: MinMsgForPacking) => {
    const auxHash = opts.auxHash || new Uint8Array(0)
    const szPayload = opts.szPayload

    return R.reduce(concatUint8a, new Uint8Array(0), [
        opts.nonce,                         // 16b, divisible by 4
        uint32ToUint8a(auxHash.length),     // 4b
        auxHash,                            // usually 0b or 32b
        padTo4B(auxHash.length),            // pad auxHash if it's not divisible by 4
        uint32ToUint8a(szPayload.length),   // 4b
        szPayload,                          // arbitrary many bytes
        padTo4B(szPayload.length),          // pad szPayload so it's divisible by 4
    ])
}

export const isSignedReqValid = (opts: ReadyToValidatedSignedReq): boolean => {
    const msg = mkPackedMsgForSigning(opts)

    return opts.nonce.length === 16
        && opts.publicKey.length === 32
        && opts.ecSig.length === 64
        && nacl.sign.detached.verify(msg, opts.ecSig, opts.publicKey)
}

export type SignedReqCreationOpts = {secretKey: Uint8Array, szPayload: Uint8Array, auxHash?: Uint8Array, aux?: Uint8Array}
export const createSignedReq = (opts: SignedReqCreationOpts): ReadyToValidatedSignedReq => {
    const nonce = nacl.randomBytes(16)
    const kp = nacl.sign.keyPair.fromSeed(opts.secretKey)

    const msg = mkPackedMsgForSigning({ szPayload: opts.szPayload, auxHash: opts.auxHash, nonce })
    const ecSig = nacl.sign.detached(msg, kp.secretKey)

    const ret = {
        nonce,
        publicKey: kp.publicKey,
        ecSig,
        szPayload: opts.szPayload,
    } as ReadyToValidatedSignedReq

    if (opts.auxHash) ret.auxHash = opts.auxHash
    if (opts.aux) ret.aux = opts.aux

    return ret
}


export const _szPayload = (payload: Payload) => strToUint8a(JSON.stringify(payload, null, 0))
export const _unszPayload = (payloadSz: Uint8Array) => JSON.parse(uint8aToStr(payloadSz))


// export const SignedReqRT = t.refinement(SignedReqNoValidationRT, (fields) => {
//         return isSignedReqValid({ ...convertBase64SignedReq(fields), szPayload: _szPayload(fields.payload) })
// })
// export interface SignedReq extends t.TypeOf<typeof SignedReqRT> {}



export const SignedReqRT = t.refinement(SignedReqNoValidationRT, (opts: SignedReqNoValidation) => {
    if (!!opts.aux !== !!opts.auxHash) {  // if opts.aux and opts.auxHash truthiness differs - error
        throw Error("Problem with message authentication: bboth 'aux' and 'auxHash' must be preset if either is.")
    }

    const binSignedReq = convertBase64SignedReq(opts)
    if (binSignedReq.auxHash && binSignedReq.aux) {
        if (!u8Eq(binSignedReq.auxHash as Uint8Array, sha256(binSignedReq.aux as Uint8Array)))
            throw Error("Invalid checksum calculated for auxillary data.")
    }

    return isSignedReqValid(binSignedReq)
})
export type SignedReq = t.TypeOf<typeof SignedReqRT>


const sortKeyValPairs = (pairs: [string, any][]) => R.sort((p1, p2): number => p1[0] < p2[0] ? -1 : (p1[0] > p2[0] ? 1 : 0), pairs)


export class PayloadDecoder<D> extends t.Type<D, Payload, Payload> {
    // readonly _D: D
    readonly _tag: string = "PayloadDecoder"

    constructor(readonly payloadName: string, readonly outPayloadRT: t.Type<D>) {
        super(
            `PayloadDecoder: ${payloadName}`,
            outPayloadRT.is,
            (i: Payload, ctx): Either<t.Errors, D> => {
                if (!R.equals(i, sortKeyValPairs(i)))
                    return t.failure('Payload failed decoding: key-value paris are not sorted', ctx)
                return outPayloadRT.validate(R.fromPairs(i), ctx)
            },
            o => sortKeyValPairs(R.toPairs(o))
        )
    }
}
