import { Either } from 'fp-ts/lib/Either'
import * as t from 'io-ts'


export const SimpleLeftRT = <LT extends t.Mixed>(InnerType: LT) => t.type({
    left: InnerType
})
export type SimpleLeft<L> = { left: L }

export const SimpleRightRT = <RT extends t.Mixed>(InnerType: RT) => t.type({
    right: InnerType
})
export type SimpleRight<R> = { right: R }

export const SimpleEitherRT = <L extends t.Mixed, R extends t.Mixed>(LeftRT: L, RightRT: R) => t.union([
    SimpleLeftRT(LeftRT),
    SimpleRightRT(RightRT)
])
export type SimpleEither<L, R> = SimpleLeft<L> | SimpleRight<R>


export type SimpleEitherResp<E, A> = SimpleEither<E, A>
export type StdSimpleEitherResp<A> = SimpleEitherResp<string, A>
export type ER<A> = StdSimpleEitherResp<A>

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
