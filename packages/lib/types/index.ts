export * from './auth'
export * from './db'
export * from './utils'

export type SimpleRight<A> = { right: A }
export type SimpleLeft<E> = { left: E }
export type SimpleEither<E, A> = SimpleRight<A> | SimpleLeft<E>
export type EitherResp<E, A> = SimpleEither<E, A>
export type ER<A> = EitherResp<string, A>

export const isRight = <E,A>(e: EitherResp<E,A>): e is SimpleRight<A> => {
    return (<SimpleRight<A>>e).right !== undefined
}

export const isLeft = <E,A>(e: EitherResp<E,A>): e is SimpleLeft<E> => {
    return (<SimpleLeft<E>>e).left !== undefined
}

export const eitherDo = <E,A,Z>(e: EitherResp<E,A>, funcs: { right: ((a:A) => Z), left: ((err:E) => Z) }): Z => {
    if (isRight(e)) {
        return funcs.right(e.right)
    } else if (isLeft(e)) {
        return funcs.left(e.left)
    }
    throw Error("eitherDo was given something other than a SimpleEither")
}
