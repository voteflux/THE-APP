<template>
    <ui-section title="Original Question">
        <QuestionCard v-if="qDocWR.isSuccess()" :q-doc="qDocWR.unwrap()" :hide-btns="['thread']" show-question="true"></QuestionCard>
        <error v-else-if="qDocWR.isFailed()">{{ qDocWR.unwrapError() }}</error>
        <loading v-else class="pb3">Loading question...</loading>

        <error v-if="ridsWR.isFailed()">{{ ridsWR.unwrapError() }}</error>
        <div v-else-if="ridsWR.isSuccess()" class="stripe-replies">
            <h3>Replies ({{ ridsWR.unwrap().length }})</h3>
            <div v-for="rid in ridsWR.unwrap()" class="ma1 pa2 ba b1 a-reply">
                <error v-if="getReplyWR(rid).isFailed()">getReplyWR(rid).unwrapError()</error>
                <div v-else-if="getReplyWR(rid).isSuccess()">
                    {{ getReply(rid).body }}
                    <hr>
                    <small><span :class="getClasses(rid)">{{ getReply(rid).display_name }}</span> at {{ renderHour(getReply(rid).ts) }} on {{ renderDate(getReply(rid).ts) }} replying to {{ getReply(rid).qid }} | This Reply's ID: {{ getReply(rid).rid }}</small>
                </div>
                <loading v-else class="pa3">Loading reply ({{ rid }})...</loading>
            </div>
        </div>
        <loading v-else>Loading replies...</loading>

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
    </ui-section>
</template>

<script lang="ts">
    import Vue from "vue";
    import WebRequest from "flux-lib/WebRequest";
    import Routes from "@/routes";
    import QuestionCard from './QuestionCard.vue';

    export default Vue.extend({
        props: ['auth'],
        components: {
            QuestionCard
        },
        data: () => ({
            qId: '',
            qDocWR: WebRequest.NotRequested(),
            ridsWR: WebRequest.NotRequested(),
            repliesWR: {},
        }),

        methods: {
            getReplyWR(rid) {
                return this.repliesWR[rid]
            },
            getReply(rid) {
                return this.repliesWR[rid].unwrap()
            },
            renderHour(d: Date) {
                return `${d.getHours()}:${d.getMinutes()}`
            },
            renderDate(d: Date) {
                return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()}`
            },

            getClasses(rid) {
                let wr = this.getReplyWR(rid)
                if (wr.isSuccess() && wr.unwrap().is_staff)
                    return "staff-reply"
                return ""
            },

            doInitialRefresh() {
                this.qDocWR = WebRequest.Loading();
                this.ridsWR = WebRequest.Loading();
                const p1 = this.$flux.v3.qanda.getReplyIds(this.qId).then(wr => {
                    this.ridsWR = wr.map(r => r['reply_ids'])
                    this.ridsWR.do({
                        success: (rids: any) => (rids as string[]).map(rid => {
                            this.repliesWR[rid] = WebRequest.Loading()
                            this.$flux.v3.qanda.getReply(rid).then(wr => {
                                this.repliesWR[rid] = wr.map(r => r['reply'])
                                this.$forceUpdate();
                            })
                        })
                    })
                })
                const p2 = this.$flux.v3.qanda.getQuestion(this.qId).then(wr => {
                    this.qDocWR = wr.map(d => d['question'])
                })
                return Promise.all([p1, p2] as Promise<any>[])
            }
        },

        mounted(): void {
        },

        created() {
            this.qId = this.$route.params.id;
            this.doInitialRefresh();
        }
    })
</script>

<style lang="scss">
    .stripe-replies > .a-reply {
        background-color: #fafafa;
    }
    .stripe-replies > .a-reply:nth-child(even) {
        background-color: #e0e0e0;
    }

    .staff-reply {
        color: teal;
        font-weight: bold;
    }

</style>
