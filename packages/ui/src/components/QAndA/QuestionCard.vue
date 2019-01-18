<template>
    <v-card class="mv3">
        <v-card-title primary-title>
            <v-layout column>
                <h3 class="db headline mb-0">Title: {{qDoc.title}}</h3>
                <div>Asked by {{qDoc.display_name}} <sub>at {{qDoc.ts}}</sub></div>
            </v-layout>
        </v-card-title>
        <v-card-text>
            <p>Question: {{qDoc.question}}</p>
        </v-card-text>
        <!--<v-card-actions>-->
            <!--<v-btn grow>Downvote</v-btn>-->
            <!--<v-btn grow>Upvote</v-btn>-->
        <!--</v-card-actions>-->
    </v-card>
</template>

<script lang=ts>
import Vue from 'vue';

export default Vue.extend({
    props: ['qDoc', 'auth'],
    methods: {
    },
})
</script>

<style scoped>

</style>
