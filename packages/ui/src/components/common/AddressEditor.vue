<template>
    <div style="min-height: 6rem;" class="flex flex-row items-center pl4 pr4">
        <div v-if="state == DISPLAY" class="flex flex-row items-center justify-between w-100">
            <div class="w-30 v-mid">
                Address as on electoral roll
            </div>
            <div class="w-30 v-mid">
                {{ user.addr_street_no }} {{ user.addr_street }} <br>
                {{ user.addr_suburb }} <br>
                {{ user.addr_postcode }}
            </div>
            <div class="w-30 v-mid tr">
                <v-btn class="dib" v-on:click="initAddrForm()"><v-icon small left v-text="'edit'" />Edit</v-btn>
            </div>
        </div>

        <v-form v-else ref="form" class="w-100" @submit="virtualSubmit()" >
            <loading v-if="isLoading" class="flex justify-center">
                Loading...
            </loading>
            <div v-else-if="state == SAVING" class="flex justify-center">
                Saving...
            </div>
            <div v-else class="flex felx-row items-center justify-between">

                <div class="w-20 tl">
                    <v-btn class="" v-on:click="prevFormPart()"><v-icon small left v-text="'arrow_back'" />Back</v-btn>
                </div>
                <div class="w-60">
                    <div v-if="state == INPUT_POSTCODE" class="flex flex-row flex-wrap items-center justify-center">
                        <v-text-field autofocus label="Postcode" v-model="newAddress.addr_postcode" v-on:keyup.enter="virtualSubmit()" :rules="[rules.postcode]" type="text" />
                    </div>
                    <div v-if="state == INPUT_SUBURB">
                        <div v-if="suburbs.length > 0">
                            <v-autocomplete autofocus label="Suburb" v-model="newAddress.addr_suburb" :items="suburbs" :rules="[rules.nonEmpty]" v-on:keyup.enter="virtualSubmit()" />
                        </div>
                        <Error v-else>
                            No suburbs found for {{ newAddress.addr_postcode }}
                        </Error>
                    </div>
                    <div v-if="state == INPUT_STREET" class="flex flex-row flex-wrap items-center">
                        <div class="w-30-ns w-100 pr2">
                            <v-text-field autofocus label="Unit/Street No." type="text" v-model="newAddress.addr_street_no" size="10" v-on:keyup.enter="virtualSubmit()" :rules="[rules.nonEmpty]" />
                        </div>
                        <div class="w-70-ns w-100">
                            <v-autocomplete label="Street" v-model="newAddress.addr_street" :items="streets" v-on:keyup.enter="virtualSubmit()" :rules="[rules.nonEmpty]" />
                        </div>
                    </div>
                </div>
                <div class="w-20 tr">
                    <v-btn class="" v-on:click="nextFormPart()" :class="nextBtnCls()" :disabled="!canGoNext()">
                        <span v-if="state == INPUT_STREET"><v-icon small left v-text="'save'" />Save</span>
                        <span v-else>Next<v-icon small right v-text="'arrow_forward'" /></span>
                    </v-btn>
                </div>
            </div>
        </v-form>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Error} from '@c/common'
import {MsgBus, M} from '@/messages'
import WR from 'flux-lib/WebRequest'
import WebRequest from 'flux-lib/WebRequest';
import { UserV1Object } from '../../lib/api';

enum Cs {
    INPUT_COUNTRY,  // not yet used
    INPUT_POSTCODE,
    INPUT_SUBURB,
    INPUT_STREET,
    SAVING,
    LOADING,
    ERROR,
    DISPLAY
}

export default Vue.extend({
    components: {Error},

    props: {
        user: Object as () => UserV1Object
    },

    data: () => ({
        req: {
            suburbs: WR.NotRequested(),
            streets: WR.NotRequested(),
            fullUserDeets: WR.NotRequested(),
        },
        state: Cs.DISPLAY,
        isLoading: false,
        newAddress: {
            addr_country: "AU",
            addr_postcode: "",
            addr_street: "",
            addr_street_no: "",
            addr_suburb: ""
        },
        suburbs: [] as string[],
        streets: [] as string[],
        errMsg: {},
        rules: {
            postcode: (v) => /\d+/.test(v) || "Must be 4 digits.",
            nonEmpty: v => !!v || "Required",
        },
        ...Cs
    }),

    methods: {
        gotError(e) {
            this.state = Cs.ERROR
            this.errMsg = e
            this.isLoading = false
        },

        resetAddrForm() {
            this.state = Cs.DISPLAY
            this.newAddress = {
                addr_country: "AU",
                addr_postcode: "",
                addr_street: "",
                addr_street_no: "",
                addr_suburb: ""
            }
            this.isLoading = false
        },

        initAddrForm() {
            this.state = Cs.INPUT_POSTCODE
            this.newAddress.addr_postcode = ""
        },

        canGoNext() {
            // @ts-ignore
            // if (this.$refs.form && this.$refs.form.validate() === false) return false
            switch(this.state) {
                case Cs.INPUT_POSTCODE:
                    return /^\d{4}$/.test(this.newAddress.addr_postcode)
                case Cs.INPUT_SUBURB:
                    return /^.+$/.test(this.newAddress.addr_suburb)
                case Cs.INPUT_STREET:
                    return /^.+$/.test(this.newAddress.addr_street) && /^.+$/.test(this.newAddress.addr_street_no)
                default:
                    return true
            }
        },

        loadSuburbs(postcode: string) {
            this.$flux.v1.getSuburbs('au', postcode)
                .then((r) => (this.req.suburbs = r) && r.do({
                    failed: e => this.gotError,
                    success: (_subs) => {
                        this.suburbs = _subs.suburbs
                        this.isLoading = false
                    }
                }))
        },

        loadStreets(postcode, suburb) {
            this.$flux.v1.getStreets('au', postcode, suburb)
                .then(r => (this.req.streets = r) && r.do({
                    failed: e => this.gotError,
                    success: _streets => {
                        this.streets = _streets.streets
                        this.isLoading = false
                    }
                }))
        },

        nextFormPart() {
            if (this.state == Cs.INPUT_POSTCODE || this.state == Cs.INPUT_SUBURB) {
                this.isLoading = true;
            }

            switch (this.state) {
                case Cs.INPUT_POSTCODE:
                    this.loadSuburbs(this.newAddress.addr_postcode)
                    this.state = Cs.INPUT_SUBURB
                    this.newAddress.addr_suburb = ''
                    break
                case Cs.INPUT_SUBURB:
                    this.loadStreets(this.newAddress.addr_postcode, this.newAddress.addr_suburb)
                    this.state = Cs.INPUT_STREET
                    this.newAddress.addr_street = ''
                    this.newAddress.addr_street_no = ''
                    break
                case Cs.INPUT_STREET:
                    this.state = Cs.SAVING
                    this.$flux.v1.saveUserDetails({...this.newAddress, s: this.$props.user.s})
                        .then(r => {
                            (this.req.fullUserDeets = r) && r.do({
                                failed: e => { throw e },
                                success: fullUserDeets => {
                                    MsgBus.$emit(M.GOT_USER_DETAILS, fullUserDeets)
                                    this.state = Cs.DISPLAY
                                }
                            })}, e => {
                            this.errMsg = e
                            this.state = Cs.ERROR
                        });
                    break
                default:
                    this.resetAddrForm()
            }
        },

        nextBtnCls() {
            if (this.canGoNext()) {
                return ''
            } else {
                return 'disabled'
            }
        },

        prevFormPart() {
            switch (this.state) {
                case Cs.INPUT_POSTCODE:
                    this.resetAddrForm()
                    break
                case Cs.INPUT_SUBURB:
                    this.state = Cs.INPUT_POSTCODE
                    break
                case Cs.INPUT_STREET:
                    this.state = Cs.INPUT_SUBURB
                    break
                default:
                    this.resetAddrForm()
            }
        },

        virtualSubmit() {
            return this.canGoNext() && this.nextFormPart()
        }
    },

    mounted() {
        this.resetAddrForm()
    }
})
</script>

<style lang="scss" scoped>
</style>
