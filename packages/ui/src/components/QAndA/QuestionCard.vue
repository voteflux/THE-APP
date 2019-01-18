<template>
    <v-card>
        <v-card-title primary-title>
            <h3 class="headline mb-0">Q Title: {{qDoc.title}}</h3>
            <h4 class="f-subheadline">Asked by {{qDoc.display_name}} at {{qDoc.ts}}</h4>
            <v-divider light></v-divider>
            <div>Q Body: {{qDoc.question}}</div>
        </v-card-title>
    </v-card>
</template>

<script lang=ts>
import Vue from 'vue';

export default Vue.extend({
    props: {
        qDoc: Object as () => {title: string, display_name: string, question: string, ts: string, qid: string}
    },
    methods: {

    },
})
</script>

<style scoped>

</style>
