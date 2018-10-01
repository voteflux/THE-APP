<template>
<div class="flex flex-row justify-center items-center align-center pl4 pr4">
    <v-text-field
        ref="field"
        class="h-100 v-mid"
        :type="type"
        :placeholder="name"
        :label="name"
        v-model="newValue"
        v-on:keyup.enter="_onEnter()"
        :loading="isLoading()"
        :pattern="pattern"
        :disabled="isDisabled()"
        :error-messages="genSavedStatus()"
    >
        <div slot="append">
            <v-fade-transition>
                <div v-if="edited()">
                    <v-icon @click="_onSave()" v-text="'save'" class="mr2" />
                    <v-icon @click="_onReset()" v-text="'undo'" />
                </div>
            </v-fade-transition>
        </div>
    </v-text-field>
    <div v-if="lockable" :class="getClasses() + ' ml4'">
        <v-btn flat small fab @click="toggleLock()" @mouseover="lockMO(true)" @mouseleave="lockMO(false)">
            <v-icon v-text="getLockIcon()" />
        </v-btn>
    </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Editable from "./Editable.vue"

export default Vue.extend({
    components: { Editable },

    props: {
        name: String,
        value: String,
        type: String,
        placeholder: String,
        onSave: Function,
        pattern: String,
        lockable: Boolean,
    },

    data: () => ({
        newValue: "",
        lockMouseover: false,
        unlocked: false,
        loading: false,
    }),

    methods: {
        edited() {
            return this.newValue !== this.$props.value
        },

        _onStart() { },

        _onSave() {
            this.unlocked = false
            this.loading = true
            this.$props.onSave(this.newValue).then(() => this.loading = false)
        },

        _onReset() {
            this.newValue = this.$props.value
        },

        _onEnter() {
            // if (this.newValue !== this.$props.value) {
            //     (<any>this.$refs.mainEdit)._doSave()
            // } else {
            //     (<any>this.$refs.mainEdit).resetNoSave()
            // }
            this._onSave()
        },

        lockMO(setTo) {
            this.lockMouseover = setTo
        },
        toggleLock() {
            const newStatus = !this.unlocked
            this.unlocked = newStatus
            if (newStatus) {
                // @ts-ignore
                setTimeout(() => this.$refs.field.$el.getElementsByTagName("input")[0].focus())
            }
        },
        lockOpen() { return this.unlocked || this.lockMouseover },
        getLockIcon() {
            return this.lockOpen() && !this.lockMouseover ? "lock_open" : "lock"
        },
        getClasses() {
            return this.lockOpen() ? "dark-grey-4" : ""
        },
        getHoverStyles() {
            return "dark-grey-2"
        },
        isLoading() {
            return this.loading
        },
        isDisabled() {
            return !this.unlocked && this.lockable
        },
        genSavedStatus() {
            if (this.newValue === this.$props.value) return []
            return [ 'Not saved yet.' ]
        }
    },

    mounted(){
        this.newValue = this.$props.value
    }
})
</script>

<style scoped lang="scss">
</style>
