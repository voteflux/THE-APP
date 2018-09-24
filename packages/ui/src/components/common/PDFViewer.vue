<template>
    <div v-if="showPdf">
        <h3>PDF: {{ title }} <small><a :href="pdf" target="_blank"><fa-icon icon="save" /></a></small></h3>
        <iframe :src="pdf" style="min-height: 50vh; height: 50vh" width="100%" frameborder="0" class="mv2" />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Maybe } from 'tsmonad'

export const PDFViewer = Vue.extend({
    props: {
        pdfMaybe: {
            type: Object as () => Maybe<string>,
            default: Maybe.nothing() as Maybe<string>
        }
    },

    computed: {
        showPdf(): boolean {
            console.log(this.pdfMaybe)
            return Maybe.isJust(this.$props.pdfMaybe)
        },
        pdf(): string {
            return this.$props.pdfMaybe.valueOrThrow()
        }
    },
})
export default PDFViewer
</script>
