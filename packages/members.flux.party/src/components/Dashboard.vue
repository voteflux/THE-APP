<template>
    <div>
        <flux-logo title="Dashboard"/>

        <UiSection title="Your Summary">
            <UserSummary :user='user'></UserSummary>
        </UiSection>

        <UiSection v-if="roles.isSuccess() && roles.unwrap().length > 0" title="Admin Utilities">
            <warning>This section is under active development</warning>
            <ul class="ul-spaced">
                <li v-if="hasRole(Roles.ADMIN)">Admin utils link will go here when done</li>
                <li v-if="hasRole(Roles.FINANCE)"><router-link :to="Routes.FinanceUtils">Finance Utilities</router-link></li>
                <li v-if="hasRole(Roles.ORGANISER)">Organiser utils link will go here when done</li>
                <li v-if="hasRole(Roles.COMMS)">Comms utils link will go here when done</li>
                <li v-if="hasRole(Roles.REGO_OFFICER)">Rego Officer utils link will go here when done</li>
            </ul>
        </UiSection>

        <ui-section title="Member Tools">
            <ul class="ul-spaced">
                <li><router-link :to="Routes.EditUserDetails">Change your member details or preferences</router-link></li>
                <li><router-link :to="Routes.MembershipRevocation">Revoke your membership</router-link></li>
                <!-- <li><a href="/anon_validation.html">Help validate other members</a></li> -->
            </ul>
        </ui-section>

        <ui-section title="Log Out">
            <button class="" v-on:click="MsgBus.$emit(M.LOGOUT)">Log Out Now</button>
        </ui-section>

    </div>
</template>


<script lang="ts">
import Vue from "vue";
import UserSummary from "./UserSummary.vue";
import OrganiserUtils from "./OrganiserUtils.vue";
import FinanceUtils from "./FinanceUtils.vue"
import { UiSection, Warning } from "./common";

import Routes from "../routes"
import Roles from "../lib/roles";

import {M, MsgBus} from "../messages"
import WebRequest from "@/lib/WebRequest";

export default Vue.extend({
    name: "Dashboard",
    components: { UserSummary, UiSection, Warning },
    props: {
        user: Object,
        roles: WebRequest,
    },
    data: () => ({
        Roles,
        Routes,
        M, MsgBus,
    }),
    methods: {
        hasRole(r) {
            const rs = this.$props.roles
            if (rs.isSuccess()) {
                return rs.unwrap().includes(r)
            }
            return false
        }
    }
});
</script>


<style scoped>
ul.ul-spaced li {
    margin-top: 10px;
}
</style>
