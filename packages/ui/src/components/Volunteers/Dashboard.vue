<template>

    <div>

        <flux-logo title="Volunteers Dashboard" />

        <ui-section title="Nondisclosure (Required to access member details)">
            <NdaStatusAndCta :user="user" :auth="auth" />
        </ui-section>

    </div>

</template>

<script lang="ts">
import Vue from 'vue'
import { NdaStatusAndCta } from './NDA'

export default Vue.extend({
    components: {NdaStatusAndCta, },
    props: ['user', 'auth']
})
</script>
