<template>
    <div class="flex flex-wrap flex-row items-center tl editable-root editable-expand">
        <div :class="'col flex flex-wrap items-center ' + calcWidth()">
            <div class="col w-40-ns w-100 var-name">
                <div class="pl2 dib f6 f5-ns b normal-ns pr2">
                    {{ name }}
                </div>
            </div>
            <div class="col w-60-ns w-100 pl0-ns pl2">
                <!-- <transition-slide> -->
                    <div v-if="state == DISPLAY" :key="DISPLAY" class="pv2">
                        {{ value }}
                    </div>
                    <div v-else-if="state == EDITING" :key="EDITING" class="">
                        <slot/>
                    </div>
                    <div v-else-if="state == SAVING" :key="SAVING" class="pv2">
                        Saving...
                    </div>
                    <div v-else-if="state == ERROR" :key="ERROR" class="pv2">
                        Error: {{ err.msg }}
                    </div>
                <!-- </transition-slide> -->
            </div>
        </div>

        <!--  -->
        <div v-if="!autoSave" class="col w-30 w-25-ns flex flex-no-wrap justify-around icons">
            <!-- :click="onSave(newValue)" -->
            <div v-if="state == EDITING" class="btn-group">
                <button class="tool-btn" v-on:click="resetNoSave()">❌</button>
                <button class="tool-btn" v-on:click="_doSave()">💾</button>
            </div>

            <div v-if="state == DISPLAY" class="">
                <button v-on:click="startEdit()" class="tool-btn">✏️</button>
            </div>

            <div v-if="state == SAVING">
                <div class="tool-btn" style="opacity:0">&nbsp;</div>
            </div>

            <div v-if="state == ERROR">
                <button class="tool-btn" v-on:click="resetNoSave()">🔄</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';

// NOTE: SOMEWHAT DEPRECATED - COULD BE USED TO GENERALISE OTHER EDITABLES STILL

enum Cs {
    // state constants
    DISPLAY,
    EDITING,
    SAVING,
    ERROR,
    // some UI constants
    SMALL,
    NOT_SMALL,
}

const Editable = Vue.extend({
    props: {
        name: String,
        value: String,
        onSave: Function,
        onReset: Function,
        onStart: Function,
        autoSave: {
            type: Boolean,
            default: false
        }
    },

    data: () => ({
        state: Cs.DISPLAY,
        newValue: '',
        err: {msg: ""},
        ...Cs
    }),

    methods: {
        calcWidth() {
            if (this.autoSave) {
                return 'w-100'
            }
            return "w-75-ns w-70"
        },

        startEdit() {
            this.newValue = this.$props.value
            this.state = Cs.EDITING
            this.$props.onStart()
        },

        _autoSave() {
            if (this.autoSave) {
                this._doSave()
            }
        },

        _doSave() {
            this.state = Cs.SAVING
            return this.$props.onSave()
                .then(() => {
                    this.state = Cs.DISPLAY
                }).catch(e => {
                    this.state = Cs.ERROR
                    this.err = this.$err(e)
                })
        },

        resetNoSave() {
            this.state = Cs.DISPLAY
            this.$props.onReset()
        }
    },

    mounted(){
        if (this.autoSave) {
            this.startEdit()
        }
    }
})
export default Editable;
</script>

<style scoped lang="scss">
// @import "tachyons-sass/tachyons.scss";

// button {
//     @extend .mv2;
//     @extend .mh1;
//     @extend .f4;
// }

// // .editable-root {
// //     min-height: 5rem;
// // }

// // .editable-expand {
// //     transition: height 0.5s ease-in-out;
// // }

// .var-name {
//     @extend .pa0-ns;
//     @extend .pa1;
// }

// .col {
// }

// .icons {
//     min-height: 2.1rem;
// }

// .v-messages__wrapper {
//     display: none;
// }
</style>
