<template>
    <ui-section title="Original Question">
        <!--<div style="text-align: center;">-->
            <!--<v-btn large color="info" @click="openAskPage()"><v-icon left>question_answer</v-icon> Ask a Question</v-btn>-->
            <!--<v-btn large color="" @click="setShowQs('mine')" v-if="showWhichQuestions !== 'mine'" :disabled="yourQsWR.isNotRequested()">Show My Questions</v-btn>-->
            <!--<v-btn large color="" @click="setShowQs('all')" v-if="showWhichQuestions !== 'all'">Show All Questions</v-btn>-->
        <!--</div>-->
        <!--<ui-collapsible title="Your Questions" no-collapse v-if="showWhichQuestions === 'mine'">-->
            <!--<div v-if="yourQsWR.isSuccess() && yourQsWR.unwrap().questions.length > 0">-->
                <!--<div v-for="q in yourQsWR.unwrap().questions" class="pv1">-->
                    <!--<QuestionCard :q-doc="q"></QuestionCard>-->
                <!--</div>-->
            <!--</div>-->
            <!--<h4 style="text-align: center;" v-else-if="yourQsWR.isSuccess()">You haven't asked any questions yet.</h4>-->
            <!--<loading v-else-if="yourQsWR.isLoading() || yourQsWR.isNotRequested()">Loading-->
            <!--</loading>-->
            <!--<div v-else-if="yourQsWR.isFailed()">-->
                <!--<error>Failed to load your questions! 😢<br>{{ yourQsWR.unwrapError() }}</error>-->
                <!--<v-btn color="warning" block @click="refreshYourQs()">Retry?</v-btn>-->
            <!--</div>-->
        <!--</ui-collapsible>-->
        <!--<ui-collapsible title="All Questions" no-collapse v-if="showWhichQuestions === 'all'">-->
            <!--<div v-if="allQsWR.isSuccess() && allQsWR.unwrap().questions.length > 0">-->
                <!--<div v-for="q in allQsWR.unwrap().questions" class="pv1">-->
                    <!--<QuestionCard :q-doc="q"></QuestionCard>-->
                <!--</div>-->
            <!--</div>-->
            <!--<h4 style="text-align: center;" v-else-if="allQsWR.isSuccess()">No questions have been asked yet.</h4>-->
            <!--<loading v-else-if="allQsWR.isLoading() || allQsWR.isNotRequested()">Loading-->
            <!--</loading>-->
            <!--<div v-else-if="allQsWR.isFailed()">-->
                <!--<error>Failed to load your questions! 😢<br>{{ allQsWR.unwrapError() }}</error>-->
                <!--<v-btn color="warning" block @click="refreshAllQs()">Retry?</v-btn>-->
            <!--</div>-->
        <!--</ui-collapsible>-->
        Thread
    </ui-section>
</template>

<script lang="ts">
    import Vue from "vue";
    import WebRequest from "flux-lib/WebRequest";
    import Routes from "@/routes";

    export default Vue.extend({
        props: ['auth'],
        components: {},

        data: () => ({
        }),

        methods:{
        },

        mounted(): void {
        },

        created(): void {
        }
    })
</script>
