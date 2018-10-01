<template>

    <div>

        <flux-logo title="Volunteers Dashboard" />

        <ui-section title="Nondisclosure (Required to access member details)">
            <NdaStatusAndSign :user="user" :auth="auth" />
        </ui-section>

    </div>

</template>

<script lang="ts">
import Vue from 'vue'
import { NdaStatusAndSign } from './NDA'

export default Vue.extend({
    components: { NdaStatusAndSign },
    props: ['user', 'auth']
})
</script>
