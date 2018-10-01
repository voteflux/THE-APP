<template>
    <div>
        <UiSection title="Donations (sorted by timestamp; decending)">
            <Error v-if="req.donations.isFailed()">{{ req.donations.unwrapError() }}</Error>
            <Loading v-else-if="!req.donations.isSuccess()">Loading donations...</Loading>
            <div v-else>
                <DonationTable :donations="req.donations.unwrap().donations" />
            </div>
        </UiSection>
    </div>
</template>

<script lang="ts">
const JSError = Error;
import Vue from 'vue'
import FluxLogo from '@c/common/FluxLogo.vue';
import Loading from '@c/common/Loading.vue';
import { Error, UiSection, DonationTable } from '@c/common';
import WebRequest from 'flux-lib/WebRequest';
import { Auth, Paginated } from '@/lib/api';

import Routes from '@/routes'

export default Vue.extend({
    components: { FluxLogo, Error, Loading, UiSection, DonationTable },
    props: {
        auth: Object as () => Auth,
    },
    data: () => ({
        req: {
            donations: WebRequest.NotRequested()
        },
        pageN: 0,
        limit: 50,
        Routes
    }),
    methods: {
        getDonations(_pageN?:number, _limit?:number) {
            const pageN = _pageN || this.pageN
            const limit = _limit || this.limit
            this.req.donations = WebRequest.Loading()
            this.$flux.v2.getDonations({...this.$props.auth, pageN, limit})
                .then(r => this.req.donations = r)
        },
        changePage(dir: 'next' | 'prev'): void {
            if (dir === 'next') {
                console.error('unimplemented...')
            } else if (dir === 'prev') {

            } else {
                throw new JSError(<any>('Should have recieved one of "next" or "prev" for `dir` but got ' + (<any>dir).toString()))
            }
        }
    },
    mounted(){
        this.getDonations(this.pageN, this.limit)
    }
})
</script>

<style lang="scss" scoped>
</style>
