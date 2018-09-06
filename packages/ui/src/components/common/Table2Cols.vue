<template>
    <div class="cl mb2 table">
        <Row2 class="row pa1" v-for="row in data" :key="row[0]" :lVal="row[0]" :rVal="row[1]"></Row2>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Row2 from "./Row2.vue";

export default Vue.extend({
    components: { Row2 },
    props: ["data"]
});
</script>

<style scoped>
.table > .row:nth-child(even) {
    background-color: #eee;
}
</style>
