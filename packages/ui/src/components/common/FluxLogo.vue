<template>
    <div class="w-100 flex flex-row align-left items-left">
        <div class="f5 flex items-center" @click="goBack()" v-if="showBack">
            <fa-icon icon="arrow-circle-left"/>
            <span class="ml1 underline">Back</span>
            <img src="/img/flux-mark-optimised.svg" class="h2 ml3">
        </div>
        <h2 class="flex items-center justify-between">
            <!-- <img src="/img/flux-text-logo.svg" class="h1 v-mid ml2"> -->
            <span class="">
                <!-- &mdash; --> {{ title }}
            </span>
        </h2>
        <span>&nbsp;</span>
    </div>
</template>

<script type="ts">
    export default {
        props: {
            title: String,
            showBack: {
                type: Boolean,
                default: true,
            }
        },
        methods: {
            goBack() {
                this.$router.back()
            }
        }
    }
</script>

<style scoped lang="scss">
// @import "tachyons";
</style>
