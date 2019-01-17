<template>
    <div class="tl mt2">
        <h3 class="" v-bind:class="genClasses()">
            <v-btn fab flat small v-if="!noCollapse" @click="toggleCollapsed()">
                <v-icon v-text="genIcon()" />
            </v-btn>
            {{ title }}
        </h3>
        <transition name="fade" mode="out-in">
            <div v-if="!collapsed" class="ph2 us-body">
                <slot></slot>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: {
        "title": String,
        "dangerZone": Boolean,
        'noCollapse': Boolean,
        'startCollapsed': Boolean,
    },
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
        },
    },
    mounted() {
        this.collapsed = this.startCollapsed;
    },
});
</script>

<style lang="scss" scoped>
</style>
