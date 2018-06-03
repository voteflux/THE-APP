<template>
    <div class="error db ma2">
        <div class="heading pl2 pt2 pr1">Error:</div>
        <div class="err-text pl2 pb2 pr2">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    name: "error"
});
</script>

<style scoped>
.error {
    /* color: #ffffff; */
    color: white;
    border: solid 0px;
    border-color: #aa0000;

    background-color: #d44;
    border-left-width: 4px;

    text-align: left;
    font-size: 0.9rem;
}

.heading {
    font-weight: 600;
}

.err-text {
}
</style>
