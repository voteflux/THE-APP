<template>
    <div>
        <UiSection title="Your Summary">
            <UserSummary :user='user'></UserSummary>
        </UiSection>

        <v-divider class="mt3" />

        <!-- <UiSection v-if="showAdmin()" title="Admin Utilities">
            <warning>This section is under active development</warning>
            <ul class="ul-spaced">
                <li v-if="hasRole(Roles.ADMIN)">Admin utils link will go here when done</li>
                <li v-if="hasRole(Roles.ADMIN)"><router-link :to="Routes.AdminAuditRoles">Audit Roles and Permissions</router-link></li>
                <li v-if="hasRole(Roles.FINANCE)"><router-link :to="Routes.FinanceMenu">Finance/Donations Utilities</router-link></li>
                <li v-if="hasRole(Roles.ORGANISER)">Organiser utils link will go here when done</li>
                <li v-if="hasRole(Roles.COMMS)">Comms utils link will go here when done</li>
                <li v-if="hasRole(Roles.REGO_OFFICER)">Rego Officer utils link will go here when done</li>
            </ul>

        </UiSection>
        <v-divider v-if="showAdmin()" /> -->

        <!--
        <Section title="Member Tools" :noCollapse="true">
            <ul class="ul-spaced">
                <li><router-link :to="Routes.EditUserDetails">Change your member details or preferences</router-link></li>
                <li><router-link :to="Routes.MembershipRevocation">Revoke your membership</router-link></li>
                <!-/- <li><a href="/anon_validation.html">Help validate other members</a></li> -/->
            </ul>
        </Section>

        <v-divider class="mt3" />
        -->

        <Section title="Get Involved" :noCollapse="true" class="child-bg-alt" >
            <EditableOpt class="row" name="I'm interested in standing as a candidate" :value="user.candidature_federal" :onSave="savePropFactory('candidature_federal')" />
            <EditableOpt class="row" name="I'd like to volunteer" :value="user.volunteer" :onSave="savePropFactory('volunteer')" />
        </Section>

        <v-divider class="mt3" />

        <Section title="Log Out" :noCollapse="true">
            <v-btn color="warning" class="mt2" v-on:click="MsgBus.$emit(M.LOGOUT)">Log Out Now</v-btn>
        </Section>

    </div>
</template>


<script lang="ts">
import assert from 'assert'
import Vue from "vue";
import UserSummary from "./UserSummary.vue";
import OrganiserUtils from "./OrganiserUtils.vue";
import FinanceUtils from "./FinanceUtils.vue"
import { UiSection, Warning, Section, EditableOpt } from "@c/common";

import Routes from "../routes"
import Roles from "../lib/roles";

import {M, MsgBus} from "../messages"
import WebRequest from "flux-lib/WebRequest";
import { Auth } from 'flux-lib/types/db';
import { Req, RolesResp } from 'flux-lib/types/db'

export default Vue.extend({
    name: "Dashboard",
    components: { UserSummary, UiSection, Warning, Section, EditableOpt },
    props: {
        user: Object,
        roles: Object as () => Req<RolesResp>,
        auth: Object as () => Auth
    },
    data: () => ({
        Roles,
        Routes,
        M, MsgBus,
    }),
    methods: {
        hasRole(r) {
            const rs: Req<RolesResp> = this.$props.roles
            if (rs.isSuccess()) {
                return rs.unwrap().roles.includes(r) || rs.unwrap().roles.includes("admin")
            }
            return false
        },

        showAdmin() {
            return this.roles.isSuccess() && this.roles.unwrap().roles.length > 0
        },

        savePropFactory(prop) {
            return (newValue) => {
                if (prop == 's' || prop == 'authToken') {
                    throw Error("refusing to save user prop s or authToken")
                }
                const toSave = { [prop]: newValue, ...this.$props.auth }
                return this.$flux.v1.saveUserDetails(toSave)
                    .then(this.$flux.utils.onGotUserObj);
            }
        },
    }
});
</script>


<style scoped>
ul.ul-spaced li {
    margin-top: 10px;
}
</style>
