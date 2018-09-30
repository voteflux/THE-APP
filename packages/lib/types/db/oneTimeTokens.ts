import { ObjectID } from 'bson';
import { ReqReceipt } from './auth';


export enum TokenNamespaces {
    SEC_TOKEN_2 = "secToken2",
    LOGIN_REQ = "loginReq",
}


export type OneTimeRedeemInfo = {
    ts: number,
    receipt: ReqReceipt
}


export type OneTimeTokenDoc = {
    namespace: string,
    tokenHash: string,
    creationTs: number,
    expiry: number,
    uid: ObjectID,
    redeemInfo?: OneTimeRedeemInfo,
}
