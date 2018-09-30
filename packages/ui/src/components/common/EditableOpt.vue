<template>
    <div class="flex felx-row justify-between items-center pl4 pr4 editable-root">
        <div class="w-50">{{name}}</div>
        <div class="w-25 tr pr2">
            <div v-if="!this.loading" class="flex items-center justify-end">
                <span>{{ renderValue() }}</span>
                <span class="ml4">
                    <div v-if="useDropdown === true">
                        <v-select :loading="loading" v-model="newValue" :items="[{text: trueName, value: true}, {text: falseName, value: false}]" />
                    </div>
                    <v-switch v-else :loading="loading" v-model="newValue" />
                </span>
            </div>
            <loading v-else>Saving...</loading>
        </div>
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
        optNames: [] as string[],
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
            return this.$props.value === true ? this.optNames[0] : this.optNames[1]
        },

        checkForSave() {
            if (this.newValue !== this.$props.value) this._onSave()
        },
    },

    mounted(){
        this._onReset()
        this.optNames = [this.$props.trueName || "Yes", this.$props.falseName || "No" ]
    },
})
</script>

<style scoped lang="scss">
@import "tachyons";

.var-name {
    @extend .pa0-ns;
    @extend .pa1;
}

.col {
}

.icons {
    min-height: 2.1rem;
}
</style>
