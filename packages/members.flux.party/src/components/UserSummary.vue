<template>
    <div>
        <div v-if="user && user.loading !== true">
            <h3>Your Current Details:</h3>

            <Table2Cols :data="userSummaryData()"></Table2Cols>

            <UserDetailsValid :user="user" />

            <div>
                <router-link :to="R.EditUserDetails">See or Edit your details</router-link>
            </div>
        </div>

        <div v-if="user && user.loading === true">
            <h3>Loading your details...</h3>
        </div>
    </div>
</template>


<script lang="ts">
import Vue from "vue";
import R from "../routes";
import { Table2Cols } from "./common";
import UserDetailsValid from "./UserDetails/UserDetailsValid.vue"

export default Vue.extend({
    components: { Table2Cols, UserDetailsValid },

    props: {
        user: {
            type: Object
        }
    },

    data: () => ({
        R
    }),

    methods: {
        userSummaryData() {
            return [
                ["Name", this.$formatName(this.$props.user)],
                ["Address", this.$formatAddress(this.$props.user)],
                ["Australian Voter", this.$props.user.onAECRoll ? "Yes" : "No"]
            ];
        }
    },

    created() {}
});
</script>

<style scoped>
</style>
