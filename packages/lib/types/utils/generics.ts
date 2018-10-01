import * as t from 'io-ts'

// export interface CallableRT1<R<, InnerRT> {
//     (type: InnerRT): R extends t.TypeOf<infer RT> ? R : never
// }

// interface CallableRT2<L, R> {
//     (...args: any[]): L | R
// }

// export type GenericReturnTypeRT<GenericRtF, R> = GenericRtF extends CallableRT1<infer RT, R> ? RT : never

// export type GenericReturnType2RT<LRT extends t.Mixed, RRT extends t.Mixed, X> = X extends Callable<t.UnionType<(LRT | RRT)[]>> ? t.TypeOf<LRT> | t.TypeOf<RRT> : never
