<template>
    <div>
        <flux-logo title="Donation Entry"/>

        <ui-section title="Enter Donation">
            <form @submit="saveDonation()" class="flex flex-wrap">
                <div class="w-50-l w-100">
                    <label>email: <input type="text" placeholder="name@example.com" v-model="entry.email"/></label>
                    <label>name: <input type="text" placeholder="Fname Mnames Sname" v-model="entry.name"/></label>
                    <label>branch: <input type="text" placeholder="/AUS" v-model="entry.branch"/></label>
                    <label>amount ({{ entry.unit }}): <input type="number" placeholder="10.22" v-model.number="entry.amount" @change="updateRecentSimilar()"/></label>
                    <label>units: <input type="text" placeholder="AUD" v-model="entry.unit" /></label>
                    <editable-date name="Date" :initDate="initDate" :onSave="onDateSave" :autoSave="true" />
                </div>
                <div class="w-50-l w-100">
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

            <div v-if="!R.equals(entry, defaultDonation)" class="flex justify-between flex-row flex-wrap">
                <Section title="Preview" class="w-100 w-50-l pa2">
                    <donation :donation="entry" />
                </Section>
                <div class="w-50 w-25-l pa2">
                    <h3>Similar Donations ({{ logreq() || req.recentSimilar.map(d => d.donations.length).unwrapOr('...') }})</h3>
                    <div v-if="req.recentSimilar.isSuccess()" class="f6">
                        <span v-for="(item, index) in req.recentSimilar.unwrap().donations" :key="index">
                            <Donation :donation="item" :small="true" class="mb1" />
                        </span>
                    </div>
                    <Error v-else-if="req.recentSimilar.isFailed()">
                        {{ req.recentSimilar.unwrapError() }}
                    </Error>
                    <Loading v-else-if="req.recentSimilar.isLoading()" >
                        Loading donations ( amount == {{entry.amount}} )...
                    </Loading>
                    <span v-else>Waiting for update...</span>
                </div>
                <div class="w-50 w-25-l pa2">
                    <h3>Save</h3>
                    <div v-if="entryComplete()">
                        <button @click="saveDonation()">Save and send email receipt</button>
                    </div>
                    <div v-else>
                        Please fill in all fields of the donation entry.
                    </div>
                </div>
            </div>
        </ui-section>

        <StatusSuccess v-if="req.saveReq.isSuccess()">
            Donation saved.
        </StatusSuccess>

        <Loading v-if="req.saveReq.isLoading()">Saving Donation...</Loading>

        <ui-section title="Recently Entered Donations">
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
import { UserV1Object, SortMethod, Donation as DonationT, DonationsResp, SM } from 'flux-lib/types/db';
import WebRequest from 'flux-lib/WebRequest';
import FluxLogo from '@/components/common/FluxLogo.vue';
import Loading from '@/components/Loading.vue';
import { Error, UiSection, Donation, Paginate, EditableDate, AddressEditor, Section, StatusSuccess, Loading } from '@/components/common';
import { Auth, Paginated } from '@/lib/api';
import { Req } from '@/lib/api';

const defaultDonation: DonationT = {
    ts: (new Date()).getTime() / 1000 | 0,
    email: '',
    name: '',
    branch: '/AUS',
    amount: 0,
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
    components: { FluxLogo, Loading, UiSection, Error, Loading, Paginate, Donation, EditableDate, AddressEditor, Section, StatusSuccess },
    props: {
        user: Object as () => Req<UserV1Object>,
        auth: Object as () => Auth
    },
    data: () => ({
        req: {
            donations: WebRequest.NotRequested(),
            recentSimilar: WebRequest.NotRequested(),
            saveReq: WebRequest.NotRequested(),
        } as {
            donations: Req<DonationsResp>,
            recentSimilar: Req<DonationsResp>,
            saveReq: Req<{}>,
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
        updateRecentSimilar() {
            this.req.recentSimilar = WebRequest.Loading()
            this.$flux.v2.getDonations({ ...this.auth, query: {amount: this.entry.amount}, sortMethod: SM.ID })
                .then(r => this.req.recentSimilar = r)
        },
        saveDonation() {
            this.req.saveReq = WebRequest.Loading()
            this.$flux.v2.addNewDonation({ ...this.auth, doc: {...this.entry} as DonationT })
                .then(r => this.req.saveReq = r)
            this.entry = {...defaultDonation}
            this.getDonations()
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
        },
        logreq() {
            console.log(this.req.recentSimilar)
            console.log(this.req.recentSimilar.map(d => d.donations.length))
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
