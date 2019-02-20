import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'
import {QandaQuestion, QandaReply} from "flux-lib/types/db/qanda";

export const state = {
    app: {
        historyCount: 0,
        jwt_token: '',
    },
}
export type AppState = typeof state

export enum AppFs {
    initHistoryCount = "initHistoryCount",
    modHistoryCount = "modHistoryCount",
    setJwtToken = "setJwtToken",
}

export const mutations = {
    [AppFs.initHistoryCount]: (state: AppState) => { state.app.historyCount = 0 },
    [AppFs.modHistoryCount]: (state: AppState, modVal) => { state.app.historyCount += modVal },
    [AppFs.setJwtToken]: (state: AppState, jwt_token) => { state.app.jwt_token = jwt_token },
}

export type AppMuts = typeof mutations
