<template>
    <div>
        <ui-section title="Menu">
            <ul class="ul-spaced">
                <li><router-link :to="Routes.FinanceDonationLog">Donation Log</router-link></li>
                <li><router-link :to="Routes.FinanceDonationEntry">Enter a Donation</router-link></li>
            </ul>
        </ui-section>

        <ui-section title="Dashboard">
            Let Max know of suggestions to put here
        </ui-section>
    </div>
</template>

<script lang="ts">
const JSError = Error;
import Vue from 'vue'
import FluxLogo from '@c/common/FluxLogo.vue';
import Loading from '@c/common/Loading.vue';
import { Error, UiSection, Paginate, Donation } from '@c/common';
import WebRequest from 'flux-lib/WebRequest';
import { Auth, Paginated } from '@/lib/api';

import Routes from '@/routes'

export default Vue.extend({
    components: { FluxLogo, Error, Loading, UiSection },
    props: {
        auth: Object as () => Auth,
    },
    data: () => ({
        Routes
    }),
    methods: {
    },
    mounted(){
    }
})
</script>

<style lang="scss" scoped>
</style>
