<template>
    <div>
        <UserDetailsValid :user="user" />

        <warning class="mt3 mb3">If alter your name or address you'll need to validate your details again.</warning>

        <div class="child-bg-alt tl">
            <UiSection title="Your Name">
                <h5>(must match electoral roll)</h5>
                <EditableText class="row" name="First Name" :value="user.fname" :onSave="savePropFactory('fname')" type="text" />
                <EditableText class="row" name="Middle Names" :value="user.mnames" :onSave="savePropFactory('mnames')" type="text" />
                <EditableText class="row" name="Surname" :value="user.sname" :onSave="savePropFactory('sname')" type="text" />
            </UiSection>

            <UiSection title="Contact Details">
                <EditableText lockable class="row" name="Email" :value="user.email" :onSave="savePropFactory('email')" type="email" />
                <EditableText lockable class="row" name="Contact Number" :value="user.contact_number" :onSave="savePropFactory('contact_number')" type="tel" placeholder="+61 401 555 555" />
            </UiSection>

            <UiSection title="Your Address">
                <h5>(must match electoral roll)</h5>
                <AddressEditor class="row" :user="user" />
            </UiSection>

            <UiSection title="Other Details">
                <EditableDate class="row" name="Date of Birth" :initDate="mkDobFromUser()" :onSave="saveDob" />
                <EditableOpt class="row" name="I'm an Australian Voter" :value="user.onAECRoll" :onSave="savePropFactory('onAECRoll')" />
            </UiSection>

            <UiSection title="Membership Options">
                <EditableOpt class="row" name="I'm interested in standing as a candidate" :value="user.candidature_federal" :onSave="savePropFactory('candidature_federal')" />
                <EditableOpt class="row" name="I'd like to volunteer" :value="user.volunteer" :onSave="savePropFactory('volunteer')" />
                <EditableOpt class="row" name="Recieve SMSs?" trueName="None" falseName="All" :value="user.smsOptOut" :useDropdown="true" :default="false" :onSave="savePropFactory('smsOptOut')" />
                <EditableOpt class="row" name="Is it okay to call you?" trueName="No" falseName="Yes" :value="user.do_not_call" :useDropdown="true" :default="false" :onSave="savePropFactory('do_not_call')" />
            </UiSection>
        </div>
    </div>
</template>

<script lang="ts">
import assert from 'assert'

import Vue from 'vue'
import UserDetailsValid from "./UserDetailsValid.vue"
import { UiSection, EditableText, EditableDate, EditableOpt, AddressEditor } from '@c/common'

import {MsgBus, M} from '../../messages'
import { mkErrContainer } from "../../lib/errors"


export default Vue.extend({
    components: { EditableText, EditableDate, EditableOpt, AddressEditor, UserDetailsValid, UiSection },
    props: ["user", 'auth'],
    data: () => ({
    }),
    methods: {
        savePropFactory(prop) {
            return async (newValue) => {
                assert(prop != 's' && prop != 'authToken')
                const toSave = { [prop]: newValue, ...this.auth }
                const r = await this.$flux.v1.saveUserDetails(toSave)
                    .then(this.$flux.utils.onGotUserObj);
                return r
            }
        },

        mkDobFromUser() {
            const d = new Date()
            const user = this.$props.user
            d.setFullYear(user.dobYear)
            d.setMonth(user.dobMonth - 1)
            d.setDate(user.dobDay)
            return d
        },

        async saveDob(newDob: Date) {
            const dobDay = newDob.getDate()
            const dobMonth = newDob.getMonth() + 1
            const dobYear = newDob.getFullYear()
            const dob = `${dobYear}-${dobMonth}-${dobDay}`
            return this.$flux.v1.saveUserDetails({dobDay, dobMonth, dobYear, dob, s: this.$props.user.s})
        }
    }
})
</script>

<style scoped>
</style>
