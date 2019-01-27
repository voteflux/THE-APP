import * as Vuex from 'vuex';

import { QandaQuestion, QandaReply } from 'flux-lib/types/db/qanda';

export default new Vuex.Store({
    state: {
        qanda: {
            qids: [] as string[],
            questions: {} as {[qid:string]: QandaQuestion[]},
            reply_ids: {} as {[qid:string]: string[]},
            replies: {} as {[rid:string]: QandaReply[]},

        }
    }
})