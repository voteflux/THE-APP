import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'
import {QandaQuestion, QandaReply} from "flux-lib/types/db/qanda";

export const state = {
    qanda: {
        qids: [] as string[],
        questions: {} as {[qid:string]: QandaQuestion},
        yourQs: {} as {[qid:string]: QandaQuestion},
        replyIds: {} as {[qid:string]: string[]},
        replies: {} as {[rid:string]: QandaReply},
        recentReply: {} as QandaReply,
        recentQuestion: {} as QandaQuestion,
    }
}
export type QandaState = typeof state

// export const getters = {
//     // qanda: {
//     //
//     // }
// }

// export const actions = {
//
// }

export enum QandaFs {
    setQids = "setQids",
    setYourQs = "setYourQs",
    setAllQs = "setAllQs",
    setReplyIds = "setReplyIds",
    setReplies = "setReplies",
    setRecentReply= "setRecentReply",
    setRecentQuestion = "setRecentQuestion"
}

export const mutations = {
    [QandaFs.setQids]: (state, newQids) => { state.qanda.qids = newQids },
    [QandaFs.setYourQs]: (state, qs) => { qs.map(q => state.qanda.yourQs[q.qid] = q) },
    [QandaFs.setAllQs]: (state, qs) => { qs.map(q => state.qanda.questions[q.qid] = q) },
    [QandaFs.setReplyIds]: (state, {qid, rids}) => { state.qanda.replyIds[qid] = rids },
    [QandaFs.setReplies]: (state, rs) => { rs.map(r => { state.qanda.replies[r.rid] = r }) },
    [QandaFs.setRecentReply]: (state, r) => { state.qanda.recentReply = r },
    [QandaFs.setRecentQuestion]: (state, q) => { state.qanda.recentQuestion = q },
}

export type QandaMuts = typeof mutations
