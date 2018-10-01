import { FindOneOptions } from 'mongodb';
import { Collection } from 'mongodb'
import { throwIfNull } from '../utils'
import { PromE } from '../types'
import * as TE from 'fp-ts/lib/TaskEither'



export const findOneOr = async <T extends Object>(c: Collection<T>, query: { [K in keyof T]?: any }, opts: FindOneOptions, msg: string): PromE<T> => {
    return await TE.tryCatch(() => c.findOne(query, opts).then(throwIfNull(msg)), () => msg).run()
}
