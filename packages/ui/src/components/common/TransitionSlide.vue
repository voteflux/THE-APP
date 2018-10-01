<template>
    <transition
        name="slide-fade"
        @before-leave="beforeLeave"
        @leave="leave"
    >
        <slot/>
    </transition>
</template>

<script lang="ts">
// DOES NOT WORK PROPERLY
import Vue from 'vue'

export default Vue.extend({
    name: 'transition-slide',
    data: () => ({
        lastTop: {
            beforeLeave: '0px',
            leave: '0px',
        }
    }),
    methods: {
        beforeLeave(el) {
            const {marginLeft, marginTop, width, height, ...other} = window.getComputedStyle(el)
            console.log("BEFORE_LEAVE", {marginLeft, marginTop, width, height, ...this.lastTop}, {other}, el.offsetLeft, el.offsetTop)
            el.style.left = `${el.offsetLeft - parseFloat(marginLeft || '0')}px`
            el.style.top = `${el.offsetTop - parseFloat(marginTop || '0')}px`
            el.style.width = width || "inherit"
            el.style.height = height || "inherit"
            // el.style.position = 'absolute'
            this.lastTop.beforeLeave = el.offsetTop
        },
        leave(el) {
            const {marginLeft, marginTop, width, height, ...other} = window.getComputedStyle(el)
            console.log("LEAVE", {marginLeft, marginTop, width, height, ...this.lastTop}, {other}, el.offsetLeft, el.offsetTop)
            this.lastTop.leave = el.offsetTop
        }
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

/* .absolute {
    position: absolute;
} */
</style>
