import _Either, {Either, left, right} from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import * as R from 'ramda'
import sha256 from 'fast-sha256';
import nacl from 'tweetnacl'

import { HashRT } from './data'
import { concatUint8a, u8Eq, base64ToUint8a, uint8aToBase64, strToUint8a, uint8aToStr } from '../../utils'
import { runEitherPredicates } from '../../utils/either';


/**
 * AUTHENTICATION DETAILS (2.0)
 *
 * Valid messages are _signed_ using an Ed25519 keypair.
 * The associate public key is authorized via a JWT token.
 *
 * To create signed messages use `createSignedReq`
 * To validate signed messages use `isSignedReqValid`
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
        path: t.string,
        payload: PayloadRT,
        ecSig: EcSigBase64RT,
        publicKey: PubKeyBase64RT,
        nonce: NonceBase64RT,
    }),
    SignedAuxPartRT
])
export type SignedReqNoValidation = t.TypeOf<typeof SignedReqNoValidationRT>


type ReqTy = string | Uint8Array

type PreSignReq<Ty extends ReqTy> =
    {path: string, auxHash?: Ty}
    & (Ty extends string ? {payload: Payload, aux?: Payload} : {szPayload: Uint8Array, aux?: Uint8Array})

type SignedFragment<Ty extends ReqTy> = { publicKey: Ty, ecSig: Ty, nonce: Ty }

type SignedReq<Ty extends ReqTy> =
    SignedFragment<Ty> & PreSignReq<Ty>

type PossiblySignedReq<Ty extends ReqTy> =
    Partial<SignedFragment<Ty>> & PreSignReq<Ty>

type MinMsgForPacking = {path: string, nonce: Uint8Array, szPayload: Uint8Array, auxHash?: Uint8Array}
export type CompleteSignedReqBin = SignedReq<Uint8Array>
export type CompleteSignedReq = SignedReq<string>

export type SignedReqCreationOpts = {
    path: string,
    secretKey: Uint8Array,
    szPayload: Uint8Array,
    auxHash?: Uint8Array,
    aux?: Uint8Array
}

export type ReqReceipt = {
    path: string,
    auxHash?: string,
    payload: Payload,
    nonce: string,
}



export const SignedReqJsRT = t.refinement(SignedReqNoValidationRT, (opts: SignedReqNoValidation) => {
    if (!!opts.aux !== !!opts.auxHash) {  // if opts.aux and opts.auxHash truthiness differs - error
        throw Error("Problem with message authentication: bboth 'aux' and 'auxHash' must be preset if either is.")
    }
    return isSignedReqValid(opts)
})
export type SignedReqJs = t.TypeOf<typeof SignedReqJsRT>



/**
 * convert a signed request in base64 format to binary (Uint8Array) format
 */
type ConvUnion<R extends ReqTy> = SignedReq<R> | PossiblySignedReq<R>
export function convertBase64SignedReq(opts: SignedReq<string>): SignedReq<Uint8Array>;
export function convertBase64SignedReq(opts: PossiblySignedReq<string>): PossiblySignedReq<Uint8Array>;
export function convertBase64SignedReq(opts: any): any {
    const ret = {} as PossiblySignedReq<Uint8Array>
    if (opts.publicKey && opts.ecSig) {
        ret.publicKey = base64ToUint8a(opts.publicKey)
        ret.ecSig = base64ToUint8a(opts.ecSig)
    }
    ret.path = opts.path
    ret.nonce = base64ToUint8a(opts.nonce)
    ret.szPayload = _szPayload(opts.payload)

    if (opts.auxHash !== undefined)
        ret.auxHash = base64ToUint8a(opts.auxHash)
    if (opts.aux)
        ret.aux = _szPayload(opts.aux)
    return ret
}


/**
 * convert a signed request in binary (Uint8Array) format to base64 format
 */
export function convertUint8aSignedReq(opts: SignedReq<Uint8Array>): SignedReq<string>;
export function convertUint8aSignedReq(opts: PossiblySignedReq<Uint8Array>): PossiblySignedReq<string>;
export function convertUint8aSignedReq(opts: any): any {
    const ret: any = {
        path: opts.path,
        nonce: uint8aToBase64(opts.nonce),
        payload: _unszPayload(opts.szPayload)
    }
    if (opts.auxHash)
        ret.auxHash = uint8aToBase64(opts.auxHash)
    if (opts.aux)
        ret.aux = _unszPayload(opts.aux)
    if (opts.publicKey && opts.ecSig) {
        ret.publicKey = uint8aToBase64(opts.publicKey)
        ret.ecSig = uint8aToBase64(opts.ecSig)
        return ret as SignedReq<string>
    }
    return ret as PossiblySignedReq<string>
}



const _lenPrefixAndPadUi8a = (xs: Uint8Array) =>
    // we use 4 bytes to prefix the length of xs, and also pad to a multiple of 4 bytes
    R.reduce(concatUint8a, new Uint8Array(0), [uint32ToUint8a(xs.length), xs, padTo4B(xs.length)])

export const mkPackedMsgForSigning = (opts: MinMsgForPacking) => {
    const auxHash = opts.auxHash || new Uint8Array(0)

    // we pad all blobs (bar the nonce) with a 4b length, then insert the blob, then pad to a multiple of 4b
    return R.reduce(concatUint8a, new Uint8Array(0), [
        opts.nonce,
        _lenPrefixAndPadUi8a(strToUint8a(opts.path)),
        _lenPrefixAndPadUi8a(auxHash),
        _lenPrefixAndPadUi8a(opts.szPayload),
    ])
}

export const isSignedReqValid = (opts: CompleteSignedReq): boolean => {
    const _opts = convertBase64SignedReq(opts)
    return isSignedReqValidBin(_opts)
}

export const isSignedReqValidBin = (opts: CompleteSignedReqBin): boolean => {
    return validationIssuesBin(opts).isRight()
}

export const validationIssues = (opts: CompleteSignedReq): Either<string, {}> =>
    validationIssuesBin(convertBase64SignedReq(opts))

export const validationIssuesBin = (opts: CompleteSignedReqBin): Either<string, {}> => {
    const msg = mkPackedMsgForSigning(opts)


    if (opts.auxHash && opts.aux) {
        if (!u8Eq(opts.auxHash, sha256(opts.aux)))
            return left("Invalid checksum calculated for auxillary data.")
    }

    const predicates: [() => boolean, string][] = [
        [ () => opts.nonce.length !== 16, "Bad nonce length" ],
        [ () => opts.publicKey.length !== 32, "Bad publicKey length" ],
        [ () => opts.ecSig.length !== 64, "Bad ecSig length" ],
        [ () => nacl.sign.detached.verify(msg, opts.ecSig, opts.publicKey), "Crypto Signature Invalid" ]
    ]

    return runEitherPredicates(predicates)
}


export const createSignedReqBinary = (opts: PreSignReq<Uint8Array>, secretSeed: Uint8Array): CompleteSignedReqBin => {
    const nonce = nacl.randomBytes(16)
    const {secretKey, publicKey} = nacl.sign.keyPair.fromSecretKey(secretSeed)
    const {path, szPayload, auxHash} = opts

    const msg = mkPackedMsgForSigning({ path, szPayload, auxHash, nonce })
    const ecSig = nacl.sign.detached(msg, secretKey)

    const ret = {
        nonce,
        publicKey,
        ecSig,
        szPayload,
    } as CompleteSignedReqBin

    if (opts.auxHash) ret.auxHash = opts.auxHash
    if (opts.aux) ret.aux = opts.aux

    return ret
}

export const createSignedReq = (opts: PreSignReq<string>, secretSeed: Uint8Array): SignedReq<string> => {
    const binOpts = convertBase64SignedReq(opts)
    const signedBin = createSignedReqBinary(binOpts, secretSeed)
    const signedOpts = convertUint8aSignedReq(signedBin)
    return signedOpts
}


export const _szPayload = (payload: Payload) => strToUint8a(JSON.stringify(payload, null, 0))
export const _unszPayload = (payloadSz: Uint8Array) => JSON.parse(uint8aToStr(payloadSz))



const sortKeyValPairs = (pairs: [string, any][]) => R.sort((p1, p2): number => p1[0] < p2[0] ? -1 : (p1[0] > p2[0] ? 1 : 0), pairs)


export const objToPayload = <T extends Object>(obj: T): Payload => {
    return sortKeyValPairs(R.toPairs(obj))
}


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
