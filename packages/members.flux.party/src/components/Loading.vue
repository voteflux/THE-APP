<template>
    <div class="loading">
        <slot/>
    </div>
</template>

<script>
    export default {
        name: "Loading",
    }
</script>

<style scoped>
    .loading {
        border: #333 1px;
        -webkit-border-radius: 5px;
        -moz-border-radius: 5px;
        border-radius: 5px;
        padding: 3px;
    }
</style>