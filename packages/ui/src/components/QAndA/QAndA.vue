<template>
    <ui-section title="Questions and Answers">
        <h4 class="pa3">
            This is a place to publicly ask questions and have them answered.
            In the future we'll add community answers, discussions, and upvote/downvote functionality.
        </h4>
        <div style="text-align: center;">
            <v-btn large color="info" @click="openAskPage()"><v-icon left>question_answer</v-icon> Ask a Question</v-btn>
            <v-btn large color="success" @click="setShowQs('mine')" v-if="showWhichQuestions !== 'mine'" :disabled="yourQsWR.isNotRequested()">Show My Questions</v-btn>
            <v-btn large color="warning" @click="setShowQs('all')" v-if="showWhichQuestions !== 'all'">Show All Questions</v-btn>
        </div>
        <ui-collapsible title="Your Questions" no-collapse v-if="showWhichQuestions === 'mine'">
            <div v-if="yourQsWR.isSuccess() && yourQsWR.unwrap().length > 0" class="stripe-children">
                <div v-for="q in yourQsWR.unwrap()" class="pv1 to-stripe">
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
            <div v-if="allQsWR.isSuccess() && allQsWR.unwrap().length > 0" class="stripe-children">
                <div v-for="q in allQsWR.unwrap()" class="pv1 to-stripe">
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
import WebRequest, {wrMap} from "flux-lib/WebRequest";
import Routes from "@/routes";
import QuestionCard from "./QuestionCard.vue";
import {QandaFs} from "@/store/qanda";
import {FluxApiMethods} from "@/lib/api";
import {shouldRefresh} from "@/store";
import * as L from '@/lambda'

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
            if (this.auth) {
                this.yourQsWR = WebRequest.Loading();
                this.yourQsWR = await L.get_from_state_or_cache(
                    this.$store,
                    this.$store.state.qanda.yourQs,
                    () => this.$flux.v3.qanda.getMine(this.auth).then(wrMap(L.get('questions'))),
                    QandaFs.setYourQs)
            }
        },

        async refreshAllQs() {
            this.allQsWR = WebRequest.Loading();
            this.allQsWR = await L.get_from_state_or_cache(
                this.$store,
                this.$store.state.qanda.questions,
                () => this.$flux.v3.qanda.getAll().then(wrMap(L.get('questions'))),
                QandaFs.setAllQs)
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

<style lang="scss">
    .stripe-children > .to-stripe {
        background-color: #fafafa;
    }
    .stripe-children > .to-stripe:nth-child(even) {
        background-color: #e0e0e0;
    }

</style>

