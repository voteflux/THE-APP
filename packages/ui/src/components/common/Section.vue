<template>
    <div class="tl mt2">
        <h3 class="" v-bind:class="genClasses()">{{ title }} <v-btn fab flat small v-if="!noCollapse" @click="toggleCollapsed()"><v-icon v-text="genIcon()" /></v-btn></h3>
        <div v-if="!collapsed" class="ph2 us-body">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: ["title", "dangerZone", 'noCollapse'],
    data: () => ({
        collapsed: false
    }),
    methods: {
        isDangerZone() {
            return (this.$props.dangerZone && this.$props.dangerZone === true)
        },

        genClasses() {
            return {
                "us-danger-zone": this.isDangerZone()
            }
        },

        genIcon() {
            return this.collapsed ? "add_box" : "indeterminate_check_box"
        },

        toggleCollapsed() {
            this.collapsed = !this.collapsed
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
