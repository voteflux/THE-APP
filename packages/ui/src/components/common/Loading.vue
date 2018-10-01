<template>
    <center class="loading">
         <v-progress-circular
            :size="20"
            indeterminate
            class="v-mid dib mr3"
            color="primary"
            />
        <div class="v-mid dib">
            <slot/>
        </div>
    </center>
</template>

<script>
    export default {
        name: "Loading",
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
