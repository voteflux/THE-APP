<template>
    <v-container fluid>
        <v-layout row>
            <v-flex xs3 align-center justify-end class="mr3"><span class="body-2 font-weight-bold">{{ label }}</span></v-flex>
            <v-flex xs9><slot /></v-flex>
        </v-layout>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    props: { label: { type: String, require: true }},
})
</script>
