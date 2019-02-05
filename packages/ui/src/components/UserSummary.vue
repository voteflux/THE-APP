<template>
    <div>
        <div v-if="user && user.loading !== true">
            <h3>Your Details:</h3>
            <v-btn outline color="info" @click="$router.push(R.EditUserDetails)">See/Edit Your Details</v-btn>
            <div>
                <router-link :to="R.EditUserDetails">See or Edit your details</router-link>
            </div>

            <UserDetailsValid :user="user" />

            <v-expand-transition>
                <Table2Cols v-if="showData" :data="userSummaryData()"></Table2Cols>
            </v-expand-transition>
            <v-expand-transition>
                <div v-if="!showData" class="bg-light-gray tc"><span class="pv4 db b">Details Preview Hidden (click show)</span></div>
            </v-expand-transition>
            <v-btn outline @click="showData = !showData" color="orange">{{ showData ? 'Hide Details' : 'Show Details' }}</v-btn>

        </div>

        <div v-if="user && user.loading === true">
            <h3>Loading your details...</h3>
        </div>
    </div>
</template>


<script lang="ts">
import Vue from "vue";
import R from "../routes";
import { Table2Cols } from "@c/common";
import UserDetailsValid from "./UserDetails/UserDetailsValid.vue"

export default Vue.extend({
    components: { Table2Cols, UserDetailsValid },

    props: {
        user: {
            type: Object
        }
    },

    data: () => ({
        R,
        showData: false,
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
