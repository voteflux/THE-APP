import { ObjectID } from 'bson';



export type SecToken2Receipt = {
    stid: ObjectID,
    secToken: string,
}


export type SecToken2Doc = {
    // _id: ObjectID,
    uid: ObjectID,
    hashedS: string,
    createdTs: number,
    expiry: number,
    name?: string,
    revoked: boolean,
}


export type SecToken2List = {
    createdTs: number,
    expiry: number,
    name?: string,
    revoked: boolean
}[]
