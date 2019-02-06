<template>
    <div class="ba pa2">
        <div>
            <v-layout column>
                <h3 class="db">
                    <span v-if="showQ">Title: {{qDoc.title}}</span>
                    <a v-else="showQ" class="db" @click="showThread()">Title: {{qDoc.title}}</a>
                </h3>
                <div>Asked by <em>{{qDoc.display_name}} </em><small>on {{ qDoc.ts.toLocaleString() }}</small></div>
            </v-layout>
        </div>
        <!--<v-card-text>-->
        <v-expand-transition>
            <div v-if="showQ">
                <h4>Question:</h4>
                    <!--<v-btn small v-if="showQ" @click="showQ = !showQ">Hide</v-btn>-->
                    <!--<v-btn small v-if="!showQ" @click="showQ = !showQ">Show</v-btn></h4>-->
                <p v-linkified v-if="showQ" style="white-space: pre-line" class="b--moon-gray ba pa2">{{qDoc.question}}</p>
            </div>
        </v-expand-transition>
        <!--</v-card-text>-->
        <div class="bt pt1">
            <v-layout row>
                <v-flex>
                    <!--<v-btn flat color="orange" @click="showQ = !showQ">{{ showQ ? 'hide q' : 'show q' }}</v-btn>-->
                    <a class="pr1" @click="doReply()">Reply</a>
                    <span v-if="!shouldHide('thread')"> | <a @click="showThread()">View ({{ this.reply_ids.map(rids => rids.length).unwrapOrDefault('...') }} replies)</a></span>
                </v-flex>
                <v-flex class="flex-grow-0" v-if="!shouldHide('showQLink')"><a @click="showQ = !showQ">{{ showQ ? 'Hide Question' : 'Show Question'}}</a></v-flex>
            </v-layout>
        </div>
    </div>
</template>

<script lang=ts>
import Vue from 'vue';
import { WebRequest, wrMap } from 'flux-lib/WebRequest';
import Routes from "@/routes";
import * as R from 'ramda'

import * as L from '@/lambda'
import {QandaFs} from "@/store/qanda";

export default Vue.extend({
    props: ['qDoc', 'auth', 'hideBtns', 'showQuestion'],
    data: () => ({
        showQ: false,
        reply_ids: WebRequest.NotRequested(),
        // replies: {},
    }),
    methods: {
        async get_reply_ids() {
            console.log(this.qDoc)
            const qid = this.qDoc.qid
            this.reply_ids = WebRequest.Loading();
            this.reply_ids = await L.get_from_state_or_cache(
                this.$store,
                this.$store.state.qanda.replyIds[qid],
                () => this.$flux.v3.qanda.getReplyIds(qid).then(wrMap(L.get('reply_ids'))),
                QandaFs.setReplyIds, rids => ({qid, rids}))
        },

        doReply() {
            this.$router.push(Routes.QandaReply.replace(":id", this.qDoc.qid))
        },

        showThread() {
            this.$router.push(Routes.QandaThread.replace(":id", this.qDoc.qid))
        },

        shouldHide(str) {
            return (this.hideBtns || []).includes(str)
        }
    },

    created(): void {
        this.get_reply_ids()
        this.showQ = !!this.showQuestion
    }
})
</script>

<style scoped>

</style>
