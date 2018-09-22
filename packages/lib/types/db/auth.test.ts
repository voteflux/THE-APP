import { PathReporter } from 'io-ts/lib/PathReporter';
import { strToUint8a, prettyPrintUint8Array } from './../../utils/index';
import sha256 from 'fast-sha256';
import nacl from 'tweetnacl'

import { createSignedReq, _szPayload, isSignedReqValid, mkPackedMsgForSigning, SignedReqRT, ReadyToValidatedSignedReq, convertBase64SignedReq, convertUint8aSignedReq } from './auth';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';

const secretKey = new Uint8Array(new Array(32).fill(1))

test('creation of packed msg w aux for signing is consistent', () => {
    const szPayload = _szPayload([["key1", "value1"], ["key2", 1337]])
    const szAux = _szPayload([["auxKey1", "auxValue1"], ["auxKey2", 9999]])
    const auxHash = sha256(szAux)

    const signedReq = createSignedReq({secretKey, szPayload, auxHash, aux: szAux})
    expect(isSignedReqValid(signedReq)).toBe(true)

    const asciiSignedReq = convertUint8aSignedReq(signedReq)
    expect(SignedReqRT.decode(asciiSignedReq).isRight()).toBe(true)

    const msg = mkPackedMsgForSigning(signedReq)
    prettyPrintUint8Array(msg)

    signedReq.szPayload[3] ^= 0xff
    expect(isSignedReqValid(signedReq)).toBe(false)
})

test('creation of packed msg no aux for signing is consistent', () => {
    const szPayload = _szPayload([["key1", "value1"], ["key2", 1337]])
    // const szAux = _szPayload([["auxKey1", "auxValue1"], ["auxKey2", 9999]])
    // const auxHash = sha256(szAux)

    const signedReq = createSignedReq({secretKey, szPayload})
    expect(isSignedReqValid(signedReq)).toBe(true)

    const asciiSignedReq = convertUint8aSignedReq(signedReq)
    ThrowReporter.report(SignedReqRT.decode(asciiSignedReq))
    expect(SignedReqRT.decode(asciiSignedReq).isRight()).toBe(true)

    const msg = mkPackedMsgForSigning(signedReq)
    prettyPrintUint8Array(msg)

    signedReq.szPayload[3] ^= 0xff
    expect(isSignedReqValid(signedReq)).toBe(false)
})
