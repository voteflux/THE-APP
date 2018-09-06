<template>
    <StatusMsg :type="T.ERROR">
        <slot></slot>
    </StatusMsg>
</template>

<script lang="ts">
import Vue from "vue";
import StatusMsg from "./StatusMsg.vue"
import { Types } from './StatusMsg.vue'

export default Vue.extend({
    components: { StatusMsg },
    data: () => ({
        T: Types
    }),
    name: "error"
});
</script>

<style scoped>
</style>
