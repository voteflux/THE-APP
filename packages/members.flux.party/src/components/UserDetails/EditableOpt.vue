<template>
    <Editable :name="name" :value="renderValue()" :onSave="_onSave" :onStart="_onStart" :onReset="_onReset">
        <div v-if="useDropdown === true">
            <select v-model="newValue" class="input">
                <option :value="true">{{ trueName }}</option>
                <option :value="false">{{ falseName }}</option>
            </select>
        </div>
        <toggle-button v-else v-model="newValue" class="pv2"/>
    </Editable>
</template>

<script lang="ts">
import Vue from 'vue'
import Editable from "./Editable.vue"

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
        optNames: [],
    }),

    methods: {
        _onStart() { },

        _onSave() {
            return this.$props.onSave(this.newValue)
        },

        setNVFromInv() {
            this.newValue = !this.newValueInv
        },

        _onReset() {
            this.newValue = this.$props.value || this.$props.default;
            this.newValueInv = !this.newValue
        },

        renderValue() {
            return this.$props.value === true ? this.optNames[0] : this.optNames[1]
        }
    },

    mounted(){
        this._onReset()
        this.optNames = [this.$props.trueName || "Yes", this.$props.falseName || "No" ]
    }
})
</script>

<style scoped lang="scss">
@import "tachyons";

.editable-root {
    min-height: 2rem;
}

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
