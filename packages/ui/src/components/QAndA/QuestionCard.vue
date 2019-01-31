<template>
    <v-card class="mv3">
        <v-card-title primary-title>
            <v-layout column>
                <h3 class="db headline">Title: {{qDoc.title}}</h3>
                <div>Asked by <em>{{qDoc.display_name}} </em><br><small>at {{ qDoc.ts.toString() }}</small></div>
            </v-layout>
        </v-card-title>
        <v-card-text>
            <h4>Question:
                <v-btn small v-if="showQ" @click="showQ = !showQ">Hide</v-btn>
                <v-btn small v-if="!showQ" @click="showQ = !showQ">Show</v-btn></h4>
            <p v-if="showQ" style="white-space: pre-line" class="b--light-gray ba br3 pa2">{{qDoc.question}}</p>
        </v-card-text>
        <!--<v-card-actions>-->
            <!--<v-btn flat color="orange" @click="showQ = !showQ">{{ showQ ? 'hide q' : 'show q' }}</v-btn>-->
            <!--<v-btn flat color="orange" @click="doReply()">Reply</v-btn>-->
            <!--<v-btn flat color="orange" @click="showThread()" :disabled="this.reply_ids.unwrapOrDefault([]).length === 0">View Thread ({{ this.reply_ids.map(rids => rids.length).unwrapOrDefault('...') }})</v-btn>-->
        <!--</v-card-actions>-->
    </v-card>
</template>

<script lang=ts>
import Vue from 'vue';
import { WebRequest, wrMap } from 'flux-lib/WebRequest';
import Routes from "@/routes";
import * as R from 'ramda'

import * as L from '@/lambda'

export default Vue.extend({
    props: ['qDoc', 'auth'],
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
    },

    created(): void {
        this.get_reply_ids()
    }
})
</script>

<style scoped>

</style>
