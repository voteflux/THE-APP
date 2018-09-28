import { ObjectID } from 'bson';



export type SecToken2Doc = {
    _id: ObjectID,
    uid: ObjectID,
    hashedS: string,
    createdTs: number,
    ttl: number,
}
