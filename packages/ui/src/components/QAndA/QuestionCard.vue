<template>
    <div class="ba pa2">
        <div class="mb1">
            <v-layout column>
                <h3 class="db">
                    <span v-if="layoutStandalone()">Title: {{qDoc.title}}</span>
                    <a v-else class="db" @click="showThread()">Title: {{qDoc.title}}</a>
                </h3>
                <v-layout row>
                    <div v-if="layoutList()" class="inline-flex ma1 v-mid items-center mr2">
                        <img v-if="!showQ" @click="toggleShow()" src="/img/doc-zoom.svg" width="30em" class="v-mid dib" />
                        <img v-else @click="toggleShow()" src="/img/doc-unzoom.svg" width="30em" />
                    </div>
                    <v-flex class="flex-grow-2">
                        <v-layout column>
                            <div>Asked by <em>{{qDoc.display_name}} </em><small>on {{ qDoc.ts.toLocaleString() }}</small></div>
                            <div class="bt pt1">
                                <v-layout row>
                                    <v-flex>
                                        <!--<v-btn flat color="orange" @click="showQ = !showQ">{{ showQ ? 'hide q' : 'show q' }}</v-btn>-->
                                        <a class="pr1" @click="doReply()">Reply</a>
                                        <span v-if="layoutList()"> | <a @click="showThread()">View ({{ this.reply_ids.map(rids => rids.length).unwrapOrDefault('...') }} replies)</a></span>
                                    </v-flex>
                                    <v-flex class="flex-grow-0" v-if="layoutList()">
                                        <!--<a @click="showQ = !showQ">{{ showQ ? 'Hide Question' : 'Show Question'}}</a>-->
                                    </v-flex>
                                </v-layout>
                            </div>
                        </v-layout>
                    </v-flex>
                </v-layout>
            </v-layout>
        </div>
        <!--<v-card-text>-->
        <v-expand-transition>
            <div v-if="showQ" class="b--moon-gray ba">
                    <!--<v-btn small v-if="showQ" @click="showQ = !showQ">Hide</v-btn>-->
                    <!--<v-btn small v-if="!showQ" @click="showQ = !showQ">Show</v-btn></h4>-->
                <p v-linkified v-if="showQ" style="white-space: pre-line" class="pa2 mb0">{{qDoc.question}}</p>
            </div>
        </v-expand-transition>
        <!--</v-card-text>-->
    </div>
</template>

<script lang=ts>
import Vue from 'vue';
import { WebRequest, wrMap } from 'flux-lib/WebRequest';
import Routes from "@/routes";
import * as R from 'ramda'

import * as L from '@/lambda'
import {QandaFs} from "@/store/qanda";
import {QandaQuestion} from "flux-lib/types/db/qanda";
import {Auth} from "flux-lib/types/db/api";

export default Vue.extend({
    props: {
        qDoc: {type: Object as () => QandaQuestion, required: true},
        auth: {type: Object as () => Auth, required: false},
        layout: { type: String, default: 'standalone', validator: (value) => ['standalone', 'list'].includes(value) },
        showQuestion: Boolean,
    },
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

        layoutStandalone() {
            return this.$props.layout === 'standalone'
        },

        layoutList() {
            return this.$props.layout === 'list'
        },

        toggleShow() {
            this.showQ = !this.showQ
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
