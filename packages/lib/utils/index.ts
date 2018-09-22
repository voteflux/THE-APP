import * as R from 'ramda'
import { TextEncoder, TextDecoder } from 'util';

import * as B64ToAB from 'base64-arraybuffer';

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




const hexChars = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "a", "b", "c", "d", "e", "f"];

const byteToHex = (b: number) => {
  return hexChars[(b >> 4) & 0x0f] + hexChars[b & 0x0f];
}



export const uint8aToStr = (bs: Uint8Array): string => {
    const decoder = new TextDecoder('utf8')
    return decoder.decode(bs)
}

export const strToUint8a = (str: string): Uint8Array => {
    const encoder = new TextEncoder()
    return encoder.encode(str)
}


export const isBase64 = (s: string): boolean => {
    try {
        B64ToAB.decode(s)
        return true
    } catch (e) {
        return false
    }
}


export const base64ToUint8a = (base64: string): Uint8Array => {
    return new Uint8Array(B64ToAB.decode(base64))
}

export const uint8aToBase64 = (bs: Uint8Array): string => {
    return B64ToAB.encode(bs.buffer as ArrayBuffer)
}


export const u8Eq = (u8a: Uint8Array, u8b: Uint8Array): boolean => {
    if (u8a.length !== u8b.length) {
        return false
    }
    let ret = true
    for (let i = 0; i < u8a.length; i++) {
        ret = ret && u8a[i] === u8b[i]
    }
    return ret
}

export const concatUint8a = (xs: Uint8Array, ys: Uint8Array) => {
    const rs = new Uint8Array(xs.length + ys.length)
    rs.set(xs)
    rs.set(ys, xs.length)
    return rs
}



const _prePrettyPrintUint8Array = (u8a: Uint8Array, cols: number) => {
    const initRow = R.map(c => c >= 0 ? byteToHex(c) : "    ", R.range(-1, cols))
    // initRow.map((_, index, xs) => xs[index] = index >= 1 ? byteToHex(index - 1) : "(--)")
    const screen = [initRow] as string[][]
    const addRow = (r: string[]) => screen.push(r)

    for (let row = 0; row < Math.ceil(u8a.length / cols); row++) {
        const rawBytes = u8a.slice(row * cols, (row + 1) * cols)
        const thisRow = new Array(cols + 1)
        thisRow[0] = `(${byteToHex(row * cols)})`
        for (let x = 0; x < cols && (row * cols + x) < u8a.length; x++) {
            thisRow[x + 1] = byteToHex(rawBytes[x])
        }
        addRow(thisRow)
    }

    return screen
}

export const prettyPrintUint8Array = (u8a: Uint8Array, cols = 16) => {
    const screen = _prePrettyPrintUint8Array(u8a, cols)
    const output = [screen[0].join(" "), screen.slice(1).map((row, i) => row.join(" ")).join("\n\n")].join(`\n${R.repeat('-', (cols+1) * 3 + 1).join('')}\n`)
    console.log(output + "\n\n")
}
