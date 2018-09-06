<template>
    <table class="cl mb2 table">
        <tr class="row headlineRow">
            <th v-for="(item, i) in getHeadings()" :key="i">{{ _renderHeading(item) }}</th>
        </tr>

        <tr v-for="(row, j) in getRows()" :key="j" class="row">
            <td v-for="(val, k) in row" :key="k">{{ val }}</td>
        </tr>
    </table>
</template>

<script lang="ts">
import Vue from "vue";
import { extractProps } from '@/lib/process'

import * as R from 'ramda'

export default Vue.extend({
    props: {
        data: Array as () => Array<{[k:string]: any}>,
        headings: {
            required: false,
            type: Array as () => string[]
        },
        prettyHeadings: {
            required: false,
            type: Object as () => ({[h: string]: string})
        }
    },
    data: () => ({
        rows: [] as any[][]
    }),
    methods: {
        getHeadings() {
            if (this.$props.headings)
                return this.$props.headings
            const headings = R.compose(
                R.uniq as (a: string[]) => string[],
                R.unnest as (a: string[][]) => string[],
                R.map(R.keys)
            )(this.$props.data)
            headings.sort()
            return headings
        },
        getRows(): any[][] {
            return R.map(extractProps(this.getHeadings()), this.$props.data as object[])
        },
        _renderHeading(h: string) {
            if (this.prettyHeadings)
                return this.prettyHeadings[h] || h
            return h
        }
    },
    mounted(){
    }
});
</script>

<style scoped>
.table > .row:nth-child(even) {
    background-color: #eee;
    border-collapse: collapse;
    border-width: 0;
}
</style>
