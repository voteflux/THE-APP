import { Option, none, some } from 'fp-ts/lib/Option';

export const state = {
    vol: {
        ndaSignature: none as Option<string>,
    }
}

export type VolState = typeof state

export enum VolFs {
    setNda = "setNda"
}

export const mutations = {
    [VolFs.setNda]: (state: VolState, newSig) => {
        state.vol.ndaSignature = some(newSig)
    }
}

export type VolMuts = typeof mutations
