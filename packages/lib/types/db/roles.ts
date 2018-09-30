import { ObjectID } from 'bson';


export type RoleDoc = {
    role: string,
    uids: ObjectID[],
}
