<template>
    <div>
        <h2>Your Details</h2>

        <UserDetailsValid :user="user" />

        <div class="child-bg-alt tl">
            <UiSection title="Your Name">
                <h5>(must match electoral roll)</h5>
                <EditableText class="row" name="First Name" :value="user.fname" :onSave="savePropFactory('fname')" type="text" />
                <EditableText class="row" name="Middle Names" :value="user.mnames" :onSave="savePropFactory('mnames')" type="text" />
                <EditableText class="row" name="Surname" :value="user.sname" :onSave="savePropFactory('sname')" type="text" />
            </UiSection>

            <UiSection title="Contact Details">
                <EditableText class="row" name="Email" :value="user.email" :onSave="savePropFactory('email')" type="email" />
                <EditableText class="row" name="Contact Number" :value="user.contact_number" :onSave="savePropFactory('contact_number')" type="tel" placeholder="+61 401 555 555" />
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
                <EditableOpt class="row" name="I'm willing to stand as a candidate" :value="user.candidature_federal" :onSave="savePropFactory('candidature_federal')" />
                <EditableOpt class="row" name="I'd like to volunteer" :value="user.volunteer" :onSave="savePropFactory('volunteer')" />
                <EditableOpt class="row" name="Recieve SMSs?" trueName="None" falseName="All" :value="user.smsOptOut" :useDropdown="true" :default="false" :onSave="savePropFactory('smsOptOut')" />
            </UiSection>
        </div>
    </div>
</template>

<script lang="ts">
import assert from 'assert'

import Vue from 'vue'
import EditableText from './EditableText.vue'
import EditableDate from './EditableDate.vue'
import EditableOpt from './EditableOpt.vue'
import AddressEditor from './AddressEditor.vue'
import UserDetailsValid from "./UserDetailsValid.vue"
import { UiSection } from '../common'

import {MsgBus, M} from '../../messages'
import { mkErrContainer } from "../../lib/errors"


const afterSave = fullUserDeetsR => {
    fullUserDeetsR.do({
        failed: e => { throw e },
        success: fullUserDeets => {
            MsgBus.$emit(M.GOT_USER_DETAILS, fullUserDeets)
        }
    })
};


export default Vue.extend({
    components: { EditableText, EditableDate, EditableOpt, AddressEditor, UserDetailsValid, UiSection },
    props: ["user"],
    data: () => ({
    }),
    methods: {
        savePropFactory(prop) {
            return (newValue) => {
                assert(prop != 's')
                const toSave = {s: this.$props.user.s, [prop]: newValue}
                return this.$flux.v1.saveUserDetails(toSave)
                    .then(afterSave);
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

        saveDob(newDob: Date) {
            const dobDay = newDob.getDate()
            const dobMonth = newDob.getMonth() + 1
            const dobYear = newDob.getFullYear()
            const dob = newDob.toISOString()
            return this.$flux.v1.saveUserDetails({dobDay, dobMonth, dobYear, dob, s: this.$props.user.s}).then(afterSave)
        }
    }
})
</script>

<style scoped>
</style>
