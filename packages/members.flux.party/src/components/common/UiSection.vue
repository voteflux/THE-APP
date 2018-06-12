<template>
    <div class="mt2 tl">
        <h2 class="us-heading bb ph2 pt3" v-bind:class="genClasses()">{{ title }}</h2>
        <div class="ph2 us-body">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: ["title", "dangerZone"],
    methods: {
        isDangerZone() {
            return (this.$props.dangerZone && this.$props.dangerZone === true)
        },

        genClasses() {
            return {
                "us-danger-zone": this.isDangerZone()
            }
        }
    }
};
</script>

<style lang="scss" scoped>
@import "tachyons";

.us-danger-zone {
    background: repeating-linear-gradient(
    135deg,
    #d6030370,
    #d6030370 5px,
    #e07b7b70 5px,
    #e07b7b70 10px
    );
}
</style>
