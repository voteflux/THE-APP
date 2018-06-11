<template>
    <div>
        <h2 class="h2">
            <img src="/img/flux-mark-optimised.svg" class="h-inherit dib v-mid">
            <img src="/img/flux-text-logo.svg" class="h-50 dib v-mid ml2"> &mdash;
            <span class="dib v-mid">Dashboard</span>
        </h2>

        <UiSection title="Your Summary">
            <UserSummary :user='user'></UserSummary>
        </UiSection>

        <UiSection v-if="roles && roles.includes(Roles.ORGANISER)" title="Organiser Utilities">
            <OrganiserUtils />
        </UiSection>

        <ui-section title="Member Tools">
            <ul class="ul-spaced">
                <li><router-link :to="Routes.EditUserDetails">Change your member details or preferences</router-link></li>
                <li><a href="/anon_validation.html">Help validate other members</a></li>
            </ul>
        </ui-section>

    </div>
</template>


<script lang="ts">
import Vue from "vue";
import UserSummary from "./UserSummary.vue";
import OrganiserUtils from "./OrganiserUtils.vue";
import { UiSection } from "./common";

import Routes from "../routes"
import Roles from "../lib/roles";

export default Vue.extend({
    name: "Dashboard",
    components: { UserSummary, UiSection, OrganiserUtils },
    props: {
        user: Object,
        roles: Array,
    },
    data: () => ({
        Roles,
        Routes
    })
});
</script>


<style scoped>
ul.ul-spaced li {
    margin-top: 10px;
}
</style>
