<template>

    <div class="mb1 cf">
        <div class="fl w-30 pr2">
            {{ lVal }}
        </div>
        <div class="fl w-70">
            {{ rVal }}
        </div>
    </div>

</template>


<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: ["lVal", "rVal"]
});
</script>


<style scoped>
</style>
