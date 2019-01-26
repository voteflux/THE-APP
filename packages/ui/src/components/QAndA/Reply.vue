<template>
    <div>
        <loading v-if="orig_q.isLoading()">Loading...</loading>
        <div v-else-if="orig_q.isNotRequested()">...</div>
        <div v-else-if="orig_q.isFailed()">
            <error v-if="orig_q.errObj && orig_q.errObj.status === 404">Question not found, so cannot reply to it.</error>
            <error v-else>{{orig_q.unwrapError()}}</error>
        </div>
        <ui-section v-else :title="`Reply to ${orig_q.unwrap().title}`">
            <div style="text-align: center;"><v-btn color="warning" @click="back()">Back</v-btn></div>
            <h4>Original Question:</h4>
            <p style="white-space: pre-line" class="b1 ba br3 pa2">{{orig_q.unwrap().question}}</p>
            <v-form v-model="valid">
                <v-textarea
                        v-model="body"
                        :rules="qRules"
                        label="Reply"
                        :counter="4000"
                        required
                ></v-textarea>

                <v-select
                        v-model="display_choice"
                        :items="displayOpts"
                        :rules="[v => !!v || 'Item is required']"
                        label="Public Name on Question"
                        required
                ></v-select>
            </v-form>
            <div style="text-align: center;"><v-btn :disabled="!valid" color="info" @click="submit()">Submit</v-btn></div>
            <div v-if="submitWR.isLoading()" style="text-align: center;"><loading>Submitting Reply...</loading></div>
            <div v-if="submitWR.isFailed()">
                <error>Error while submitting reply: {{submitWR.unwrapError()}}</error>
            </div>
        </ui-section>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import WebRequest from "flux-lib/WebRequest";
import {MsgBus, M} from "@/messages";

export default Vue.extend({
    props: ['auth'],

    data: () => ({
        orig_q: WebRequest.NotRequested(),
        valid: false,
        display_choice: 'full_name',
        displayOpts: [
            {text: 'Full Name', value: 'full_name'},
            {text: 'First Name and Surname Initial', value: 'first_plus_initial'},
            {text: 'First Initial and Surname', value: 'last_plus_initial'},
            {text: 'Anonymous', value: 'anon'}],
        body: '',
        title: '',
        qid: '',

        titleRules: [
            t => !!t || 'Title is required',
            t => (t && t.length >= 10 && t.length <= 200) || 'Title must be at between 10 and 200 characters.'
        ],
        qRules: [
            q => !!q || 'Reply body is required',
            q => (q && q.length >= 1 && q.length <= 4000) || 'Reply must be between 1 and 4000 characters.'
        ],

        submitWR: WebRequest.NotRequested(),
    }),

    methods:{
        back() {
            history.back()
        },
        async submit() {
            this.submitWR = WebRequest.Loading()
            this.submitWR = await this.$flux.v3.qanda.submitReply({
                display_choice: this.display_choice,
                body: this.body,
                qid: this.qid,

                ...this.auth
            })
            this.submitWR.do({
                // 'success': () => this.back()
            })
        },

        async getQ() {
            this.orig_q = WebRequest.Loading()
            this.orig_q = await this.$flux.v3.qanda.getQuestion(this.qid)
            this.orig_q.do({
                success: q => MsgBus.$emit(M.PAGE_TITLE_UPDATE, (q as {title: string}).title)
            })
        }
    },

    mounted(): void {

    },

    created(): void {
        this.qid = this.$route.params.id;
        this.getQ()
    }

})
</script>
