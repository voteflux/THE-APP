<template>
    <div style="min-height: 6rem;" class="flex flex-row items-center">
        <div v-if="state == DISPLAY" class="flex flex-row items-center w-100">
            <div class="w-30 pl2 v-mid">
                Address as on electoral roll
            </div>
            <div class="w-40 v-mid">
                {{ user.addr_street_no }} {{ user.addr_street }} <br>
                {{ user.addr_suburb }} <br>
                {{ user.addr_postcode }}
            </div>
            <div class="w-30 v-mid">
                <button class="tool-btn db center" v-on:click="initAddrForm()">✏️ Edit</button>
            </div>
        </div>

        <div v-else class="w-100">
            <div v-if="isLoading" class="flex justify-center">
                Loading...
            </div>
            <div v-else-if="state == SAVING" class="flex justify-center">
                Saving...
            </div>
            <div v-else class="flex felx-row items-center">

                <div class="sidebtns pr2">
                    <button class="tool-btn f5" v-on:click="prevFormPart()">🔙 Back</button>
                </div>
                <div class="w-60">
                    <div v-if="state == INPUT_POSTCODE" class="flex flex-row flex-wrap items-center justify-center">
                        <label class="mr2">Postcode:</label>
                        <input class="mw5 input w-100" v-model="newAddress.addr_postcode" v-on:keyup.enter="canGoNext() && nextFormPart()" pattern="\d*" type="text" />
                    </div>
                    <div v-if="state == INPUT_SUBURB">
                        <div v-if="suburbs.length > 0">
                            <label>Suburb:</label>
                            <select class="input" v-model="newAddress.addr_suburb">
                                <option v-for="suburb in suburbs" v-bind:key="suburb" :value="suburb">{{ suburb }}</option>
                            </select>
                        </div>
                        <Error v-else>
                            No suburbs found for {{ newAddress.addr_postcode }}
                        </Error>
                    </div>
                    <div v-if="state == INPUT_STREET" class="flex flex-row flex-wrap items-center">
                        <div class="w-30-ns w-100 pr2">
                            <label class="mr2">Street No.:</label>
                            <input type="text" v-model="newAddress.addr_street_no" size="10">
                        </div>
                        <div class="w-70-ns w-100">
                            <label>Street:</label>
                            <select class="input" v-model="newAddress.addr_street">
                                <option v-for="street in streets" v-bind:key="street" :value="street">{{ street }}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="sidebtns pl2">
                    <button class="tool-btn f5" v-on:click="nextFormPart()" :class="nextBtnCls()" :disabled="!canGoNext()">
                        <span v-if="state == INPUT_STREET">💾 Save</span>
                        <span v-else>➡️ Next</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Error} from '../common'
import {MsgBus, M} from '@/messages'

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

    props: ["user"],

    data: () => ({
        req: {},
        state: Cs.DISPLAY,
        isLoading: false,
        newAddress: {},
        suburbs: [],
        streets: [],
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

        loadSuburbs(postcode) {
            this.$flux.v1.getSuburbs('au', postcode)
                .then(r => (this.req.suburbs = r) && r.do({
                    failed: e => this.gotError,
                    success: _subs => {
                        this.suburbs = _subs.suburbs
                        this.isLoading = false
                    }
                }))
        },

        loadStreets(postcode, suburb) {
            this.$flux.v1.getStreets('au', postcode, suburb)
                .then(r => (this.req.streest = r) && r.do({
                    failed: e => this.gotError,
                    success: _streets => {
                        this.streets = _streets.streets
                        this.isLoading = false
                    }
                }))
        },

        nextFormPart() {
            if ([Cs.INPUT_POSTCODE, Cs.INPUT_SUBURB].includes(this.state)) {
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
                            })
                        }).catch(e => {
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
        }
    },

    mounted() {
        this.resetAddrForm()
    }
})
</script>

<style lang="scss" scoped>
@import "tachyons";

// .input {
//     display: inline-block;
//     width: 100%;
//     height: 100%;
//     @extend .pa1;
// }

button {
    @extend .mv2;
    @extend .mh1;
    @extend .f4;
}

.sidebtns {
    @extend .w-20;
}

.sidebtns .tool-btn {
    @extend .center;
    @extend .db;
}

.disabled {
    color: #777;
}
</style>
