import { PromE } from '../types';
import { Either, right, left } from 'fp-ts/lib/Either'
import * as R from 'ramda'

export const promiseToEither = async <R>(p: Promise<R>): PromE<R> => {
    try {
        return right(await p)
    } catch (e) {
        return left(`Error: ${e}`)
    }
}


export const runEitherPredicates = <E>(predicates: [() => boolean, E][]): Either<E, {}> => {
    return R.reduce(
        (acc, [f, err]) => acc.chain(() => f() ? right({}) : left(err)),
        right({}),
        predicates
    )
}
