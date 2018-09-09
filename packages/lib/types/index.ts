export * from './auth'
export * from './db'
export * from './utils'

export type EitherResp<E, A> = { right: A } | { left: E }
export type ER<A> = EitherResp<string, A>
