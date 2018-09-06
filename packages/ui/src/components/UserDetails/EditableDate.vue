<template>
    <Editable :name="name" :value="renderedDate()" :onSave="_onSave" :onStart="_onStart" :onReset="_onReset" class="flex flex-row items-center inputGroup">
        <div class="mv1">
            <select class="input" v-model="newDay">
                <option v-for="day in Rm.range(1,32)" v-bind:key="day" :value="day">{{day}}</option>
            </select>
            <select class="input" v-model="newMonth">
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
            </select>
            <select class="input" v-model="newYear">
                <option v-for="year in Rm.reverse(Rm.range(1900, maxYear))" v-bind:key="year" :value="year">{{year}}</option>
            </select>
        </div>
    </Editable>
</template>

<script lang="ts">
import Vue from 'vue'
import Editable from "./Editable.vue"
import * as Rm from "ramda"

export default Vue.extend({
    components: { Editable },

    props: {
        name: String,
        initDate: Date,
        onSave: Function
    },

    data: () => ({
        maxYear: (new Date()).getFullYear(),
        newDay: 1,
        newMonth: 0,
        newYear: 1980,
        Rm
    }),

    methods: {
        _onStart() { },

        _onSave() {
            const d = new Date()
            d.setDate(this.newDay)
            d.setMonth(this.newMonth)
            d.setFullYear(this.newYear)
            return this.$props.onSave(d)
        },

        _onReset() {
            const d = this.$props.initDate;
            this.newDay = d.getDate()
            this.newMonth = d.getMonth()
            this.newYear = d.getFullYear()
        },

        renderedDate() {
            const d = this.$props.initDate;
            const day = d.getDate()
            const month = d.getMonth() + 1
            const year = d.getFullYear()
            return `${day} / ${month} / ${year}`
        }
    },

    mounted(){
        this._onReset()
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
