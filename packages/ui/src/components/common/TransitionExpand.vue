<template>
    <transition
        name="expand"
        @enter="enter"
        @after-enter="afterEnter"
        @leave="leave"
    >
        <slot/>
    </transition>
</template>

<script lang="ts">
// DOES NOT WORK PROPERLY
import Vue from 'vue'

export default Vue.extend({
    name: 'transition-expand',
    methods: {
        enter(element) {
            const width = getComputedStyle(element).width;

            element.style.width = width;
            // element.style.position = 'absolute';
            element.style.visibility = 'hidden';
            element.style.height = 'auto';
            // element.style.opacity = 1;

            const height = getComputedStyle(element).height;
            // const opacity = getComputedStyle(element).opacity

            element.style.width = null;
            element.style.position = null;
            element.style.visibility = null;
            element.style.height = 0;
            // element.style.opacity = 0;

            // Trigger the animation.
            // We use `setTimeout` because we need
            // to make sure the browser has finished
            // painting after setting the `height`
            // to `0` in the line above.
            setTimeout(() => {
                element.style.height = height;
                // element.style.opacity = opacity;
            })
        },
        afterEnter(element) {
            element.style.height = 'auto';
            // element.style.opacity = 1;
        },
        leave(element) {
            const height = getComputedStyle(element).height;
            // const opacity = getComputedStyle(element).opacity;

            element.style.height = height;
            // element.style.opacity = opacity;

            setTimeout(() => {
                element.style.height = 0;
                // element.style.opacity = 0;
            });
        },
    },
})
</script>

<style scoped>
/* * {
    will-change: height;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
} */
</style>
