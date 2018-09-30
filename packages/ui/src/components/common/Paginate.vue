<template>
    <div>
        <div class="flex justify-center items-center">
            <v-btn v-on:click="prevPage()" v-bind:disabled="!hasPrevPage()">« Prev</v-btn>
            <span class="tc flex-grow">Page {{ page.pageN + 1 }} / {{ totalPages() }}</span>
            <v-btn v-on:click="nextPage()" v-bind:disabled="!hasNextPage()">Next »</v-btn>
        </div>
        <div class="db h-60vh overflow-y-scroll mb3">
            <slot/>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Paginated } from '@/lib/api';
export default Vue.extend({
    props: {
        page: Object as () => Paginated,
        onPage: Function,
    },
    methods: {
        nextPage(){
            this.$props.onPage('next')
        },
        prevPage(){
            this.$props.onPage('prev')
        },
        totalPages() {
            const {total, limit, pageN} = this.$props.page
            if (limit === 0) {
                return 1
            }
            // if total = 100 && limit = 50 we want this to come out as 2
            return ((total - 1) / limit | 0) + 1
        },
        hasPrevPage(){
            return this.totalPages() > 1 && 0 < this.page.pageN
        },
        hasNextPage(){
            return this.totalPages() < this.page.pageN + 1
        }
    }
})
</script>

<style lang="scss" scoped>
@import "tachyons";

.flex-grow {
    flex-grow: 2;
}

.h-60vh {
    height: 60vh;
}
</style>
