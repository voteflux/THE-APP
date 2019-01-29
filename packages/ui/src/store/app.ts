import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'
import {QandaQuestion, QandaReply} from "flux-lib/types/db/qanda";

export const state = {
    app: {
        historyCount: 0,
    },

    qanda: {
        qids: [] as string[],
        questions: {} as {[qid:string]: QandaQuestion[]},
        reply_ids: {} as {[qid:string]: string[]},
        replies: {} as {[rid:string]: QandaReply[]},

    }
}
export type AppState = typeof state

export enum AppFs {
    initHistoryCount = "initHistoryCount",
    modHistoryCount = "modHistoryCount",
}

const appMutations = {
    [AppFs.initHistoryCount]: (state: AppState) => { state.app.historyCount = 0 },
    [AppFs.modHistoryCount]: (state: AppState, modVal) => { state.app.historyCount += modVal },
}

export enum QandaFs {
    setQids = "setQids"
}

const qandaMutations = {
    [QandaFs.setQids]: (state, newQids) => { state.qanda.qids = newQids }
}

export const mutations = {
    ...appMutations,
    ...qandaMutations,
}

export type AppMuts = typeof mutations
