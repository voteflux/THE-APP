<template>
    <div>
        <div v-if="user.needsValidating">
            <h4 class="">
                ⚠️ Your details need validating. <v-btn color="info" @click="$router.push(R.ValidateSelf)" small>validate now</v-btn>
            </h4>
        </div>

        <!-- If a user doesn't need validating and their details are invalid then they need to change their details -->
        <div v-else-if="!user.detailsValid">
            <h4 class="">💥 Your details are not able to be validated against the electoral roll.</h4>
            <p>Reason: {{ user.validationReason }}</p>
            <!-- <p>Please <router-link :to="R.EditUserDetails">update your details</router-link>.</p> -->
            <p>Please <router-link :to="R.EditUserDetails">update your details</router-link>.</p>
            <p>
                You can manually check your details agains the electoral roll yourself at <a href="https://check.aec.gov.au" target="_blank" rel="noopener">https://check.aec.gov.au</a>.
            </p>
        </div>

        <!-- don't need validating, and details are valid -->
        <div v-else>
            <h4 class="">Your details are valid. Thanks ☺️</h4>
        </div>
    </div>
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
