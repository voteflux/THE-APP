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
@import "tachyons-sass/tachyons.scss";

// .us-danger-zone {
//     background: repeating-linear-gradient(
//     135deg,
//     #d6030370,
//     #d6030370 5px,
//     #e07b7b70 5px,
//     #e07b7b70 10px
//     );
// }
</style>
