<template>
    <h2 class="h2">
        <span class="h-inherit dib v-mid nowrap">
            <img src="/img/flux-mark-optimised.svg" class="h-inherit dib v-mid">
            <img src="/img/flux-text-logo.svg" class="h-50 dib v-mid ml2">
        </span>
        &mdash;
        <span class="dib v-mid">{{ title }}</span>
    </h2>
</template>

<script type="ts">
    export default {
        props: ["title"]
    }
</script>
