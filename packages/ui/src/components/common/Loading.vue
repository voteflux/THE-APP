<template>
    <div class="loading" style="text-align: center;">
         <v-progress-circular
            :size="size"
            indeterminate
            class="v-mid dib mr3"
            color="primary"
            />
        <div class="v-mid dib">
            <slot/>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Loading",
        props: {
            size: {
                type: Number,
                default: 20,
                required: false,
            },
        },
    }
</script>

<style scoped>
    /* .loading {
        border: #333 1px;
        -webkit-border-radius: 5px;
        -moz-border-radius: 5px;
        border-radius: 5px;
        padding: 3px;
    } */
</style>
