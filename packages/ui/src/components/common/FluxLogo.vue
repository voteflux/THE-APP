<template>
    <div class="flex flex-row justify-between items-center mt4">
        <p class="h2 v-btm absolute f5 tl underline" @click="goBack()" v-if="showBack">
            <fa-icon icon="arrow-circle-left"/> Back
        </p>
        <div class="w-100">
            <h2 class="h2 center">
                <span class="h-inherit dib v-mid nowrap">
                    <img src="/img/flux-mark-optimised.svg" class="h-inherit dib v-mid">
                    <img src="/img/flux-text-logo.svg" class="h-50 dib v-mid ml2">
                </span>
                &mdash;
                <span class="dib v-mid">{{ title }}</span>
            </h2>
        </div>
        <div class="absolute fr"></div>
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
