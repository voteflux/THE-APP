import nacl from 'tweetnacl';
import * as t from 'io-ts'

import { strToUint8a, concatUint8a, isBase64, base64ToUint8a, uint8aToBase64 } from '../../utils';

import { SzObjectIdRT, HashRT } from './data'




export enum NdaStage {
    NOT_STARTED = "NOT_STARTED",
    AWAITING_APPROVAL = "AWAITING_APPROVAL",
    APPROVED = "APPROVED",
    NOT_APPROVED = "NOT_APPROVED"
}


export type NdaStatus = {
    stage: NdaStage,
    signatureDataUri: string,
    pdfDataUri: string,
    comment?: string
}


const c = (x:any) => {
    console.log(x)
    return x
}



export const GenerateDraftNdaReqRT = t.type({
    sigPng: t.refinement(t.string, _s =>
        c(_s) !== false
        && c(_s.slice(0, 22)) === "data:image/png;base64,"
        && !!isBase64(_s.slice(22)) // must decode from base64 okay (nb: maybe need to url-decode?)
    )
})
export type GenerateDraftNdaReq = t.TypeOf<typeof GenerateDraftNdaReqRT>


export const GenerateDraftNdaRespRT = t.type({
    pdfHash: t.string,
    sigHash: t.string,
    pdfData: t.string
})
export type GenerateDraftNdaResp = t.TypeOf<typeof GenerateDraftNdaRespRT>


export const NdaDraftCommitRT = t.type({
    uid: SzObjectIdRT,
    pdfHash: HashRT,
    sigHash: HashRT,
    ts: t.number,
    acceptSig: t.union([t.string, t.null]),
})
export type NdaDraftCommit = t.TypeOf<typeof NdaDraftCommitRT>
