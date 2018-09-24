<template>
    <div class="w-100 flex flex-row align-left items-left">
        <img src="/img/flux-mark-optimised.svg" class="h2 ml3">
        <h2 class="flex justify-between ml3">
            <!-- <img src="/img/flux-text-logo.svg" class="h1 v-mid ml2"> -->
            <transition name="fade" mode="out-in">
                <!-- &mdash; --> <span>{{ title }}</span>
            </transition>
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
