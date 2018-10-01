<template>
    <div class="mt2 tl">
        <h2 class="us-heading" v-bind:class="genClasses()">{{ dangerZoneWarning() }}{{ title }}</h2>
        <div class="ph2 us-body">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: ["title", "dangerZone"],
    methods: {
        isDangerZone() {
            return (this.$props.dangerZone && this.$props.dangerZone === true)
        },
        dangerZoneWarning() {
            if (this.dangerZone)
                return "⚠️ "
            return ""
        },

        genClasses() {
            return {
                "us-danger-zone": false // this.isDangerZone()
            }
        }
    }
});
</script>

<style lang="scss" scoped>
</style>
