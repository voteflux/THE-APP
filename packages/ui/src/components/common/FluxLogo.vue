<template>
    <div class="flex flex-row justify-between items-center">
        <button class="v-mid fl btn-transparent" @click="goBack()"><fa-icon icon="arrow-circle-left" class="f3" /></button>
        <h2 class="h2">
            <span class="h-inherit dib v-mid nowrap">
                <img src="/img/flux-mark-optimised.svg" class="h-inherit dib v-mid">
                <img src="/img/flux-text-logo.svg" class="h-50 dib v-mid ml2">
            </span>
            &mdash;
            <span class="dib v-mid">{{ title }}</span>
        </h2>
        <div class="fr"></div>
    </div>
</template>

<script type="ts">
    export default {
        props: ["title"],
        methods: {
            goBack() {
                window.history.back()
            }
        }
    }
</script>
