export * from 'fp-ts/lib/Either'
import { Either, right, left } from 'fp-ts/lib/Either'

export const promiseToEither = async <R>(p: Promise<R>): Promise<Either<Error, R>> => {
    try {
        return right(await p) as Either<Error, R>
    } catch (e) {
        return left(e) as Either<Error, R>
    }
}
