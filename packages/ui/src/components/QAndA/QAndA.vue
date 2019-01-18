<template>
    <ui-section title="Questions and Answers">
        <h4 class="pa3">Flux AGM for 2018 calendar year held 19th January 2019.</h4>
        <h5 v-if="" style="text-align: center" class="pa2">We're aware of issues for some people and looking in to it. Apologies for the inconvenience.</h5>
        <div style="text-align: center;">
            <v-btn large color="info" @click="openAskPage()"><v-icon left>question_answer</v-icon> Ask a Question</v-btn>
        </div>
        <ui-collapsible title="Your Questions">
            <div v-if="yourQsWR.isSuccess() && yourQsWR.unwrap().questions.length > 0">
                <div v-for="q in yourQsWR.unwrap().questions" class="pv1">
                    <QuestionCard :q-doc="q"></QuestionCard>
                    <!--<h4 class="pb1">Title: {{q.title}}</h4>-->
                    <!--<h5 class="pb1">Author: {{q.display_name}}, Date: {{q.ts}}</h5>-->
                    <!--<p>Question: {{q.question}}</p>-->
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
        <ui-collapsible title="All Questions" start-collapsed>
            <div v-if="allQsWR.isSuccess() && allQsWR.unwrap().questions.length > 0">
                <div v-for="q in allQsWR.unwrap().questions" class="pv1">
                    <QuestionCard :q-doc="q"></QuestionCard>
                    <!--<h4 class="pb1">Title: {{q.title}}</h4>-->
                    <!--<h5 class="pb1">Author: {{q.display_name}}, Date: {{q.ts}}</h5>-->
                    <!--<p>Question: {{q.question}}</p>-->
                </div>
            </div>
            <h4 style="text-align: center;" v-else-if="allQsWR.isSuccess()">You haven't asked any questions yet.</h4>
            <loading v-else-if="allQsWR.isLoading() || allQsWR.isNotRequested()">Loading
            </loading>
            <div v-else-if="allQsWR.isFailed()">
                <error>Failed to load your questions! 😢<br>{{ allQsWR.unwrapError() }}</error>
                <v-btn color="warning" block @click="refreshYourQs()">Retry?</v-btn>
            </div>
        </ui-collapsible>
    </ui-section>
</template>

<script lang="ts">
import Vue from "vue";
import WebRequest from "flux-lib/WebRequest";
import Routes from "@/routes";
import QuestionCard from "./QuestionCard.vue";

export default Vue.extend({
    props: ['auth'],
    components: {QuestionCard},

    data: () => ({
        yourQsWR: WebRequest.NotRequested(),
        allQsWR: WebRequest.NotRequested(),
        gotNAllQs: 0,
        totalNAllQs: -1
    }),

    methods:{
        async refreshYourQs() {
            this.yourQsWR = WebRequest.Loading()
            this.yourQsWR = await this.$flux.v3.qanda.getMine(this.auth)
        },

        async getMoreQs() {
            this.allQsWR = WebRequest.Loading()
            this.allQsWR = await this.$flux.v3.qanda.getAll()
        },

        openAskPage() {
            this.$router.push(Routes.MembersAskQuestion)
        }
    },

    mounted(): void {
        this.refreshYourQs()
        this.getMoreQs()
    }

})
</script>
