import { Maybe } from 'tsmonad';

export const state = {
    vol: {
        ndaSignature: Maybe.nothing(),
    }
}

export type VolState = typeof state

export enum VolFs {
    setNda = "setNda"
}

export const mutations = {
    [VolFs.setNda]: (state: VolState, newSig) => {
        state.vol.ndaSignature = Maybe.just(newSig)
    }
}

export type VolMuts = typeof mutations
