import { Either } from 'fp-ts/lib/Either'

export type SimpleRight<A> = { right: A }
export type SimpleLeft<E> = { left: E }
export type SimpleEither<E, A> = SimpleRight<A> | SimpleLeft<E>
export type SimpleEitherResp<E, A> = SimpleEither<E, A>
export type StdSimpleEitherResp<A> = SimpleEitherResp<string, A>

export const isRight = <E,A>(e: SimpleEitherResp<E,A>): e is SimpleRight<A> => {
    return (<SimpleRight<A>>e).right !== undefined
}

export const isLeft = <E,A>(e: SimpleEitherResp<E,A>): e is SimpleLeft<E> => {
    return (<SimpleLeft<E>>e).left !== undefined
}

export const eitherDo = <E,A,Z>(e: SimpleEitherResp<E,A>, funcs: { right: ((a:A) => Z), left: ((err:E) => Z) }): Z => {
    if (isRight(e)) {
        return funcs.right(e.right)
    } else if (isLeft(e)) {
        return funcs.left(e.left)
    }
    throw Error("eitherDo was given something other than a SimpleEither")
}

export type PromE<R> = Promise<Either<string, R>>
