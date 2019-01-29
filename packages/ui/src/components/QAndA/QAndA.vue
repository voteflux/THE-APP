<template>
    <ui-section title="Questions and Answers">
        <h4 class="pa3">
            This is a place to publicly ask questions and have them answered.
            In the future we'll add community answers, discussions, and upvote/downvote functionality.
        </h4>
        <div style="text-align: center;">
            <v-btn large color="info" @click="openAskPage()"><v-icon left>question_answer</v-icon> Ask a Question</v-btn>
            <v-btn large color="" @click="setShowQs('mine')" v-if="showWhichQuestions !== 'mine'" :disabled="yourQsWR.isNotRequested()">Show My Questions</v-btn>
            <v-btn large color="" @click="setShowQs('all')" v-if="showWhichQuestions !== 'all'">Show All Questions</v-btn>
        </div>
        <ui-collapsible title="Your Questions" no-collapse v-if="showWhichQuestions === 'mine'">
            <div v-if="yourQsWR.isSuccess() && yourQsWR.unwrap().questions.length > 0">
                <div v-for="q in yourQsWR.unwrap().questions" class="pv1">
                    <QuestionCard :q-doc="q"></QuestionCard>
                </div>
            </div>
            <h4 style="text-align: center;" v-else-if="yourQsWR.isSuccess()">You haven't asked any questions yet.</h4>
            <loading v-else-if="yourQsWR.isLoading() || yourQsWR.isNotRequested()">Loading
            </loading>
            <div v-else-if="yourQsWR.isFailed()">
                <error>Failed to load your questions! 😢<br>{{ yourQsWR.unwrapError() }}</error>
                <v-btn color="warning" block @click="refreshYourQs()">Retry?</v-btn>
            </div>
        </ui-collapsible>
        <ui-collapsible title="All Questions" no-collapse v-if="showWhichQuestions === 'all'">
            <div v-if="allQsWR.isSuccess() && allQsWR.unwrap().questions.length > 0">
                <div v-for="q in allQsWR.unwrap().questions" class="pv1">
                    <QuestionCard :q-doc="q"></QuestionCard>
                </div>
            </div>
            <h4 style="text-align: center;" v-else-if="allQsWR.isSuccess()">No questions have been asked yet.</h4>
            <loading v-else-if="allQsWR.isLoading() || allQsWR.isNotRequested()">Loading
            </loading>
            <div v-else-if="allQsWR.isFailed()">
                <error>Failed to load your questions! 😢<br>{{ allQsWR.unwrapError() }}</error>
                <v-btn color="warning" block @click="refreshAllQs()">Retry?</v-btn>
            </div>
        </ui-collapsible>
    </ui-section>
</template>

<script lang="ts">
import Vue from "vue";
import WebRequest from "flux-lib/WebRequest";
import Routes from "@/routes";
import QuestionCard from "./QuestionCard.vue";
import {QandaFs} from "@/store/qanda";
import {FluxApiMethods} from "@/lib/api";
import {shouldRefresh} from "@/store";

export default Vue.extend({
    props: ['auth'],
    components: {QuestionCard},

    data: () => ({
        yourQsWR: WebRequest.NotRequested() as any,
        allQsWR: WebRequest.NotRequested() as any,
        showWhichQuestions: 'all',
        gotNAllQs: 0,
        totalNAllQs: -1
    }),

    methods:{
        async refreshYourQs() {
            if (this.auth && shouldRefresh(this.$store, QandaFs.setYourQs)) {
                this.yourQsWR = WebRequest.Loading();
                this.yourQsWR = await this.$flux.v3.qanda.getMine(this.auth)
                this.yourQsWR.do({success: (r) => this.$store.commit(QandaFs.setYourQs, r.questions)})
            }
        },

        async refreshAllQs() {
            this.allQsWR = WebRequest.Loading();
            this.allQsWR = await this.$flux.v3.qanda.getAll()
            this.allQsWR.do({success: (r) => this.$store.commit(QandaFs.setAllQs, r.questions)})
        },

        setShowQs(setTo) {
            this.showWhichQuestions = setTo;
        },

        openAskPage() {
            this.$router.push(Routes.QandaAskQuestion)
        }
    },

    mounted(): void {
    },

    created(): void {
        this.refreshYourQs()
        this.refreshAllQs()
    }

})
</script>
