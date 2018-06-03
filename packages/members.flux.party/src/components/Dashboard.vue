<template>
    <div>
        <h2>Welcome to your Dashboard</h2>

        <UiSection title="Your Summary">
            <UserSummary :user='user'></UserSummary>
        </UiSection>

        <ui-section title="Member Tools">
            <ul class="ul-spaced">
                <li><a href="/member_details.html">Change your member details or preferences</a></li>
                <li><a href="/anon_validation.html">Help validate other members</a></li>
            </ul>
        </ui-section>

    </div>
</template>


<script lang="ts">
import Vue from "vue";
import UserSummary from "./UserSummary.vue";
import { UiSection } from "./common";

export default Vue.extend({
    name: "Dashboard",
    components: { UserSummary, UiSection },
    props: ["user"]
});
</script>


<style scoped>
ul.ul-spaced li {
    margin-top: 10px;
}
</style>
