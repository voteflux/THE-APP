<template>
    <div>
        <flux-logo title="Donation Entry"/>

        <ui-section title="Enter Donation">
            <form @submit="saveDonation()" class="flex flex-row justify-between">
                <div>
                    <label>email: <input type="text" placeholder="name@example.com" /></label>
                    <label>name: <input type="text" placeholder="Fname Mnames Sname" /></label>
                    <label>branch: <input type="text" placeholder="/AUS" /></label>
                    <label>amount (AUD): <input type="number" placeholder="10.22" /></label>
                    <label>date (timestamp): <input type="text" placeholder="1573258824" /></label>
                </div>
                <div>
                    <label>addr street: <input type="text" placeholder="400 George St" /></label>
                    <label>addr city: <input type="text" placeholder="Sydney" /></label>
                    <label>addr state: <input type="text" placeholder="NSW" /></label>
                    <label>addr postcode: <input type="text" placeholder="2000" /></label>
                </div>
            </form>
        </ui-section>

        <ui-section title="Recent Donations">
            <Error v-if="req.donations.isFailed()">{{ req.donations.unwrapError() }}</Error>
            <Loading v-else-if="!req.donations.isSuccess()">Loading donations...</Loading>
            <div v-else>
                <Paginate :page="req.donations.unwrap()" :on-page="(dir) => changePage(dir)">
                    <div class="mv2" v-for="donation in req.donations.unwrap().donations" :key="donation.id">
                        <Donation :donation="donation" />
                    </div>
                </Paginate>
            </div>
        </ui-section>
    </div>
</template>

<script lang="ts">
const JSError = Error;
import Vue from 'vue'
import { UserV1Object, SortMethod } from '@lib/types/db';
import WebRequest from '@/lib/WebRequest';
import FluxLogo from '@/components/common/FluxLogo.vue';
import Loading from '@/components/Loading.vue';
import { Error, UiSection, Donation, Paginate } from '@/components/common';
import { Auth, Paginated } from '@/lib/api';

export default Vue.extend({
    components: { FluxLogo, UiSection, Error, Loading, Paginate, Donation },
    props: {
        user: Object as () => WebRequest<String, UserV1Object>,
        auth: Object as () => Auth
    },
    data: () => ({
        req: {
            donations: WebRequest.NotRequested(),
        }
    }),
    methods: {
        saveDonation() {

        },
        getDonations(_pageN?:number, _limit?:number) {
            const pageN = _pageN || 0
            const limit = _limit || 10
            this.req.donations = WebRequest.Loading()
            this.$flux.v2.getDonations({...this.$props.auth, pageN, limit, sortMethod: SortMethod.ID}).then(r => this.req.donations = r)
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
    mounted() {
        this.getDonations()
    }
})
</script>

<style scoped lang="scss">
@import 'tachyons';

label {
    @extend .flex;
    @extend .flex-row;
    @extend .justify-between;
    @extend .items-center;
    text-align: right;
    margin: 0.5rem;
}

label input {
    margin-left: 0.25rem;
}
</style>
