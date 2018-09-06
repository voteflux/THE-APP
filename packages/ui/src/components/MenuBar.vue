
<template>
    <div class="tl mh3 mv3">
        <span v-if="canGoBack()"><span class="underline" v-on:click="goBack()">Back</span></span>
        <span v-else>&nbsp;</span>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    methods: {
        canGoBack() {
            return false;
            // return window.history.length > 1;
        },
        goBack() {
            if (this.canGoBack()) {
                this.$router.go(-1);
            }
        }
    }
});
</script>

<style scoped>
</style>
