<template>
    <StatusMsg :type="T.WARNING">
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
    name: "warning"
});
</script>

<style scoped>
</style>
