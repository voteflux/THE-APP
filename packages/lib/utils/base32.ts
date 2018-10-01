import genBase from 'base-x'

// don't change this - will break encoding
export const BASE_32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

export const b32Coder = genBase(BASE_32_ALPHABET)

export const base32ToUint8a = (b32Str: string): Uint8Array =>
    new Uint8Array(b32Coder.decode(b32Str))

export const uint8aToBase32 = (bs: Uint8Array): string =>
    b32Coder.encode(bs)
