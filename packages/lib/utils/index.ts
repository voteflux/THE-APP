import * as R from 'ramda'

// (predicate: (t: any) => boolean, obj: {[k:string]:any}): any => {
//     const ret = {} as any
//     for (let k in R.keys(obj)) {
//         if (predicate(k)) {
//             ret[k] = obj[k]
//         }
//     }
//     return ret
// }

// @ts-ignore
export const filterProps = <S>(predicate, xs: {[k:string]: S}) => R.compose(R.fromPairs, R.filter(([k,v]) => predicate(k)), R.toPairs)(xs)
