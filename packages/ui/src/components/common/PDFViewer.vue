<template>
    <transition>
        <div v-if="showPdf">
            <h3>PDF: {{ title }} <small><a :href="pdf" target="_blank" :download="title + '.pdf'"><v-icon v-text="'save'" /></a></small></h3>
            <iframe :src="pdf" style="min-height: 50vh; height: 50vh" width="100%" frameborder="0" class="mv2" />
        </div>
    </transition>
</template>

<script lang="ts">
import Vue from 'vue'
import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'

export const PDFViewer = Vue.extend({
    props: {
        pdfMaybe: {
            type: Object as () => Option<string>,
            default: none as Option<string>
        },
        title: {
            type: String,
            require: true
        }
    },

    computed: {
        showPdf(): boolean {
            return isSome(this.$props.pdfMaybe)
        },
        pdf(): string {
            return this.$props.pdfMaybe.getOrElseL(() => { throw "PDFViewer.computed.pdf: cannot get PDF from Option" })
        }
    },
})
export default PDFViewer
</script>
