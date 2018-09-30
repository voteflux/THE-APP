<template>
    <!-- <Editable :name="name" :value="renderedDate()" :onSave="_onSave" :onStart="_onStart" :onReset="_onReset" :autoSave="autoSave" class="flex flex-row items-center inputGroup"> -->
        <!-- <div class="mv1">
            <select class="input" v-model="newDay" @change="_autoSave()">
                <option v-for="day in R.range(1,32)" v-bind:key="day" :value="day">{{day}}</option>
            </select>
            <select class="input" v-model="newMonth" @change="_autoSave()">
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
            <select class="input" v-model="newYear" @change="_autoSave()">
                <option v-for="year in R.reverse(R.range(1900, maxYear + 1))" v-bind:key="year" :value="year">{{year}}</option>
            </select>
        </div> -->
    <!-- </Editable> -->
    <div class="flex flex-row items-center justify-between pl4 pr4 editable-root">
        <v-menu
            ref="dateMenu"
            :close-on-content-click="false"
            v-model="dateMenuOpen"
            :nudge-right="40"
            transition="scale-transition"
            lazy
            offset-y
            full-width
            max-width="290px"
            min-width="290px"
            class="w-100"
            :open-on-click="shouldOpenMenuOnClick"
        >
            <v-text-field
                slot="activator"
                :label="`${name} (format: DD/MM/YYYY)`"
                v-model="tmpFormattedDate"
                :error-messages="tmpDateErrs()"
                @blur="parseDate()"
                v-on:keyup.enter="_onEnter()"
                :loading="loading"
                ref="input">
            </v-text-field>
            <v-date-picker v-model="vDate" no-title @input="datePickerSave()"></v-date-picker>
        </v-menu>
        <v-fade-transition>
            <div v-if="edited()" class="flex flex-row tr ml3">
                <v-icon @click="_onSave()" v-text="'save'" class="mr2" />
                <v-icon @click="_onReset()" v-text="'undo'" />
            </div>
        </v-fade-transition>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Editable from "./Editable.vue"
import * as R from "ramda"

export default Vue.extend({
    components: { Editable },

    props: {
        name: String,
        initDate: Date,
        onSave: Function,
        autoSave: Boolean
    },

    data: () => ({
        maxYear: (new Date()).getFullYear(),
        newDay: 1,
        newMonth: 0,
        newYear: 1980,
        R,
        tmpFormattedDate: '',
        date: new Date(),
        vDate: '',
        dateMenuOpen: false,
        loading: false,
        shouldOpenMenuOnClick: true,
    }),

    methods: {
        edited() {
            console.log(this.toFormattedDate(this.$props.initDate), this.tmpFormattedDate)
            return this.toFormattedDate(this.$props.initDate) !== this.tmpFormattedDate
        },

        tmpDateErrs() {
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(this.tmpFormattedDate)) {
                if (this.edited()) {
                    return [ "Unsaved" ]
                }
                return []
            }
            return [ "Invalid date. Format: DD/MM/YYYY" ]
        },

        _onStart() { },

        _onEnter() {
            this._onSave()
        },

        _onSave() {
            const d = new Date()
            d.setDate(this.newDay)
            d.setMonth(this.newMonth)
            d.setFullYear(this.newYear)
            d.setHours(12)
            d.setMinutes(0)
            d.setMilliseconds(0)
            d.setSeconds(0)
            this.loading = true
            this.shouldOpenMenuOnClick = false
            this.$props.onSave(d).then(() => this.loading = false)
            this.$nextTick(() => {
                // @ts-ignore
                this.$refs.input.$el.getElementsByTagName("input")[0].blur()
                this.dateMenuOpen = false
                this.shouldOpenMenuOnClick = true
            })
            // this.dateMenuOpen = false
            // this.$refs.input.$el.getElementsByTagName("input")[0].blur()
        },

        _onReset() {
            const d = this.$props.initDate;
            this.newDay = d.getDate()
            this.newMonth = d.getMonth()
            this.newYear = d.getFullYear()
            const {day, month, year} = {day: this.newDay.toString(), month: (this.newMonth + 1).toString(), year: this.newYear.toString()}
            this.tmpFormattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
            this.vDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            setTimeout(() => this.dateMenuOpen = false)
        },

        renderedDate(d) {
            return this.toFormattedDate(d)
        },

        setOutgoing(year, month, day) {
            this.newYear = parseInt(year)
            this.newMonth = parseInt(month) - 1
            this.newDay = parseInt(day)
            this.date = new Date(this.newYear, this.newMonth, this.newDay)
        },

        toVDate(d) {
            const day = d.getDate().toString()
            const month = (d.getMonth() + 1).toString()
            const year = d.getFullYear().toString()
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        },

        toFormattedDate(d) {
            const day = d.getDate().toString()
            const month = (d.getMonth() + 1).toString()
            const year = d.getFullYear().toString()
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
        },

        parseDate() {
            if (!this.tmpFormattedDate) return null
            const [day, month, year] = this.tmpFormattedDate.split('/')
            this.vDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            this.setOutgoing(year, month, day)
        },

        datePickerSave() {
            if (this.vDate) {
                const [year, month, day] = this.vDate.split("-")
                this.tmpFormattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
                this.setOutgoing(year, month, day)
            }
            this.dateMenuOpen = false
        },
    },

    mounted(){
        this._onReset()
    }
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
