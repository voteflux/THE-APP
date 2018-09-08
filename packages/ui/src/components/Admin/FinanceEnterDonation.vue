<template>
    <div>
        <flux-logo title="Donation Entry"/>

        <ui-section title="Enter Donation">
            <form @submit="saveDonation()" class="flex flex-row justify-between">
                <div class="w-50">
                    <label>email: <input type="text" placeholder="name@example.com" v-model="entry.email"/></label>
                    <label>name: <input type="text" placeholder="Fname Mnames Sname" v-model="entry.name"/></label>
                    <label>branch: <input type="text" placeholder="/AUS" v-model="entry.branch"/></label>
                    <label>amount ({{ entry.unit }}): <input type="number" placeholder="10.22" v-model="entry.amount"/></label>
                    <label>units: <input type="text" placeholder="AUD" v-model="entry.unit" /></label>
                    <editable-date name="Date" :initDate="initDate" :onSave="onDateSave" :autoSave="true" />
                </div>
                <div class="w-50">
                    <label>street: <input type="text" placeholder="42 Wallaby Way" v-model="entry.street"/></label>
                    <label>city: <input type="text" placeholder="Sydney" v-model="entry.city"/></label>
                    <label>state: <input type="text" placeholder="NSW" v-model="entry.state"/></label>
                    <label>postcode: <input type="text" placeholder="2000" v-model="entry.postcode"/></label>
                    <label>country: <input type="text" placeholder="Australia" v-model="entry.country"/></label>
                    <label>source: <select v-model="entry.payment_source">
                        <option value="eft" >Bank Transfer</option>
                        <option value="paypal">PayPal</option>
                        <option value="crypto">Cryptocurrency</option>
                    </select></label>
                </div>
            </form>

            <div v-if="!R.equals(entry, defaultDonation)" class="flex justify-between flex-row">
                <div class="w-70 ma2">
                    <h3>Preview</h3>
                    <donation :donation="entry" />
                </div>
                <div class="w-30 ma2">
                    <h3>Save</h3>
                    <div v-if="entryComplete()">
                        <button>Save and send email receipt</button>
                    </div>
                    <div v-else>
                        Please fill in all fields of the donation entry.
                    </div>
                </div>
            </div>
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
import * as R from 'ramda'
import { UserV1Object, SortMethod, Donation as DonationT, DonationsResp } from 'flux-lib/types/db';
import WebRequest from '@/lib/WebRequest';
import FluxLogo from '@/components/common/FluxLogo.vue';
import Loading from '@/components/Loading.vue';
import { Error, UiSection, Donation, Paginate, EditableDate, AddressEditor } from '@/components/common';
import { Auth, Paginated } from '@/lib/api';
import { Req } from '@/lib/api';

const defaultDonation: DonationT = {
    ts: (new Date()).getTime() / 1000 | 0,
    email: '',
    name: '',
    branch: '/AUS',
    amount: '',
    unit: 'AUD',
    street: '',
    city: '',
    postcode: '',
    state: '',
    country: 'Australia',
    payment_source: 'eft',
    extra_data: {},
    date: new Date().toISOString(),
    id: 'n/a'
}

export default Vue.extend({
    components: { FluxLogo, UiSection, Error, Loading, Paginate, Donation, EditableDate, AddressEditor },
    props: {
        user: Object as () => Req<UserV1Object>,
        auth: Object as () => Auth
    },
    data: () => ({
        req: {
            donations: WebRequest.NotRequested() as Req<DonationsResp>,
        } as {
            donations: Req<DonationsResp>
        },
        initDate: new Date() as Date,
        entry: R.clone(defaultDonation) as DonationT,
        defaultDonation,
        R
    }),
    methods: {
        onDateSave(newDate: Date) {
            this.entry.ts = newDate.getTime() / 1000 | 0
            this.entry.date = newDate.toISOString()
        },
        entryComplete() {
            return R.compose(R.all(p => !!p), R.values)(this.entry)
        },
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
                console.error('unimplemented...')
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

label * {
    @extend .w-60;
    margin-left: 0.25rem;
}
</style>
