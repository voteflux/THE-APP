<template>
    <div>
        <div class="flex felx-row justify-between items-center pl4 pr4 editable-root">
            <div class="w-50">{{name}}</div>
            <div class="w-25 tr pr2">
                <div class="flex items-center justify-end">
                    <div>
                        <div v-if="!this.loading">{{ renderValue() }}</div>
                        <loading v-else><small>Saving...</small></loading>
                    </div>
                    <span class="ml4">
                        <div v-if="useDropdown === true">
                            <v-select :loading="loading" v-model="newValue" :items="[{text: trueName, value: true}, {text: falseName, value: false}]" />
                        </div>
                        <v-switch v-else :loading="loading" v-model="newValue" />
                    </span>
                </div>
            </div>
        </div>

        <v-expand-transition>
            <div v-if="newValue && $slots.default">
                <div class="bt b--moon-gray mh4">
                    <slot />
                </div>
            </div>
        </v-expand-transition>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Editable from "./Editable.vue"
import { debounce } from 'ts-debounce';

export default Vue.extend({
    components: { Editable },

    props: {
        name: String,
        value: Boolean,
        type: String,
        placeholder: String,
        onSave: Function,
        trueName: String,
        falseName: String,
        default: Boolean,
        useDropdown: Boolean,
    },

    data: () => ({
        newValue: true,
        newValueInv: false,
        loading: false,
        doNotSave: false,
    }),

    watch: {
        newValue(newVal, oldVal) {
            this.checkForSave()
        }
    },

    methods: {
        _onStart() { },

        _onSave() {
            this.loading = true
            this.$props.onSave(this.newValue).then(() => this.loading = false)
        },

        setNVFromInv() {
            this.newValue = !this.newValueInv
        },

        _onReset() {
            this.newValue = this.$props.value || this.$props.default;
            this.newValueInv = !this.newValue
            this.loading = false
        },

        renderValue() {
            return this.$props.value === true ? this.$props.trueName || "Yes" : this.$props.falseName || "No"
        },

        checkForSave() {
            if (this.newValue !== this.$props.value) this._onSave()
        },
    },

    mounted(){
        this._onReset()
    },
})
</script>

<style scoped lang="scss">
</style>
