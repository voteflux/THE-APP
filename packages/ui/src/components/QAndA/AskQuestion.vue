<template>
    <ui-section title="Ask a Question">
        <div style="text-align: center;"><v-btn color="warning" @click="back()">Back</v-btn></div>
        <v-form v-model="valid">
            <v-text-field
                    v-model="title"
                    :counter="200"
                    :rules="titleRules"
                    label="Question Title"
                    required
            ></v-text-field>

            <v-text-field
                    v-model="question"
                    :rules="qRules"
                    label="Question"
                    :counter="4000"
                    required
            ></v-text-field>

            <v-select
                    v-model="select"
                    :items="displayOpts"
                    :rules="[v => !!v || 'Item is required']"
                    label="Public Name on Question"
                    required
            ></v-select>
        </v-form>
        <div style="text-align: center;"><v-btn :disabled="!valid" color="info" @click="submit()">Submit</v-btn></div>
        <div v-if="submitWR.isLoading()" style="text-align: center;"><loading>Submitting Question...</loading></div>
        <div v-if="submitWR.isFailed()">
            <error>Error while submitting question: {{submitWR.unwrapError()}}</error>
        </div>
    </ui-section>
</template>

<script lang="ts">
import Vue from "vue";
import WebRequest from "flux-lib/WebRequest";

export default Vue.extend({
    props: ['auth'],

    data: () => ({
        valid: false,
        display_choice: 'full_name',
        displayOpts: [
            {text: 'Full Name', value: 'full_name'},
            {text: 'First Name and Surname Initial', value: 'first_plus_initial'},
            {text: 'First Initial and Surname', value: 'last_plus_initial'},
            {text: 'Anonymous', value: 'anon'}],
        question: '',
        title: '',

        titleRules: [
            t => !!t || 'Title is required',
            t => (t && t.length >= 10 && t.length <= 200) || 'Title must be at between 10 and 200 characters.'
        ],
        qRules: [
            q => !!q || 'Question is required',
            q => (q && q.length >= 20 && q.length <= 4000) || 'Question must be between 20 and 4000 characters.'
        ],

        submitWR: WebRequest.NotRequested(),
    }),

    methods:{
        back() {
            history.back()
        },
        submit() {
            this.submitWR = WebRequest.Loading()
            this.$flux.v3.qanda.submit({
                display_choice: this.display_choice,
                question: this.question,
                title: this.title,
            }).then(() => this.back())
        }
    },

    mounted(): void {

    }

})
</script>
