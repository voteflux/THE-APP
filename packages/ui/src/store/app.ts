import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'

export const state = {
    app: {
        historyCount: 0,
    }
}
export type AppState = typeof state

export enum AppFs {
    initHistoryCount = "initHistoryCount",
    modHistoryCount = "modHistoryCount",
}

export const mutations = {
    [AppFs.initHistoryCount]: (state: AppState) => { state.app.historyCount = 0 },
    [AppFs.modHistoryCount]: (state: AppState, modVal) => { state.app.historyCount += modVal },
}
export type AppMuts = typeof mutations
