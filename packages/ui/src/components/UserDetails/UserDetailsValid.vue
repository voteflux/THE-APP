<template>
    <v-expand-transition>
        <div v-if="user.needsValidating" key="needsValidating">
            <h4 class="mv1">
                ⚠️ Your details need validating against the Electoral Roll. <v-btn color="info" @click="$router.push(R.ValidateSelf)" small>validate now</v-btn>
            </h4>
        </div>

        <!-- If a user doesn't need validating and their details are invalid then they need to change their details -->
        <div v-else-if="!user.needsValidating && !user.detailsValid" key="notValid">
            <h4 class="pa2 ba b--dark-red">💥 Your details are not able to be validated against the electoral roll. Edit your details to try again.</h4>
            <div class="pa2 bl bb br b--moon-gray">
                <p>Reason: {{ user.validationReason }}</p>
                <!-- <p>Please <router-link :to="R.EditUserDetails">update your details</router-link>.</p> -->
                <p>Please <v-btn small outline color="info" @click="$router.push(R.EditUserDetails)">update your details</v-btn></p>
                You can manually check your details against the electoral roll yourself at <a href="https://check.aec.gov.au" target="_blank" rel="noopener">https://check.aec.gov.au</a>.
            </div>
        </div>

        <!-- don't need validating, and details are valid -->
        <div v-else="!user.needsValidating && user.detailsValid" key="valid">
            <h4 class="">Your details are valid. Thanks ☺️</h4>
        </div>
    </v-expand-transition>
</template>

<script lang="ts">
import Vue from 'vue'
import R from '../../routes'
export default Vue.extend({
    props: ["user"],
    data: () => ({
        R
    })
})
</script>

<style scoped>

</style>
