<template>
    <div class="ba pa2">
        <div>
            <v-layout column>
                <h3 class="db">
                    <span v-if="showQ">Title: {{qDoc.title}}</span>
                    <a v-else="showQ" class="db h3" @click="showThread()">Title: {{qDoc.title}}</a>
                </h3>
                <div>Asked by <em>{{qDoc.display_name}} </em><small>on {{ qDoc.ts.toString() }}</small></div>
            </v-layout>
        </div>
        <!--<v-card-text>-->
        <div v-if="showQ">
            <h4>Question:</h4>
                <!--<v-btn small v-if="showQ" @click="showQ = !showQ">Hide</v-btn>-->
                <!--<v-btn small v-if="!showQ" @click="showQ = !showQ">Show</v-btn></h4>-->
            <p v-linkified v-if="showQ" style="white-space: pre-line" class="b--light-gray ba br3 pa2">{{qDoc.question}}</p>
        </div>
        <!--</v-card-text>-->
        <div class="bt pt1">
            <!--<v-btn flat color="orange" @click="showQ = !showQ">{{ showQ ? 'hide q' : 'show q' }}</v-btn>-->
            <a class="" @click="doReply()">Reply</a> |
            <a v-if="!shouldHide('thread')" flat color="orange" @click="showThread()">View ({{ this.reply_ids.map(rids => rids.length).unwrapOrDefault('...') }} replies)</a>
        </div>
    </div>
</template>

<script lang=ts>
import Vue from 'vue';
import { WebRequest, wrMap } from 'flux-lib/WebRequest';
import Routes from "@/routes";
import * as R from 'ramda'

import * as L from '@/lambda'

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
            this.reply_ids = WebRequest.Loading();
            this.reply_ids = await this.$flux.v3.qanda.getReplyIds(this.qDoc.qid).then(wrMap(L.get('reply_ids')))
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
