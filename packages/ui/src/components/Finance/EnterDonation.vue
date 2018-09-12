<template>
    <div>
        <flux-logo title="Donation Entry"/>

        <ui-section title="Enter Donation">
            <form @submit="saveDonation()" class="flex flex-wrap">
                <div class="w-50-l w-100">
                    <label>email:
                        <fa-icon v-if="req.checkEmail.isLoading()" icon="spinner" class="fa-spin" />
                        <input @change="checkEmail()" type="text" placeholder="name@example.com" v-model="entry.email"/>
                    </label>
                    <label>branch: <input type="text" placeholder="/AUS" v-model="entry.branch"/></label>
                    <label>
                        amount ({{ entry.unit }}): {{ req.recentSimilar.isSuccess() ? `(${nSimilarDonations} similar)` : '' }}
                        <input type="number" placeholder="10.22" v-model.number="entry.amount" @change="updateRecentSimilar()"/>
                    </label>
                    <label>units: <input type="text" placeholder="AUD" v-model="entry.unit" /></label>
                    <div v-if="entry.unit.toUpperCase() !== 'AUD'">
                        <label>AUD value: <input type="number" placeholder="13.37" v-model.number="entry.extra_data.aud_value" /></label>
                    </div>
                    <editable-date name="Date" :initDate="initDate" :onSave="onDateSave" :autoSave="true" />
                    <label>source: <select v-model="entry.payment_source">
                        <option value="eft" >Bank Transfer</option>
                        <option value="paypal">PayPal</option>
                        <option value="crypto">Cryptocurrency</option>
                    </select></label>
                    <label>comment: (optional)
                        <textarea v-model="entry.extra_data.comment" placeholder="Any relevant details we might want in future." />
                    </label>
                </div>
                <div class="w-50-l w-100">
                    <label>name: <input type="text" placeholder="Fname Mnames Sname" v-model="entry.name"/></label>
                    <label>street: <input type="text" placeholder="42 Wallaby Way" v-model="entry.street"/></label>
                    <label>city: <input type="text" placeholder="Sydney" v-model="entry.city"/></label>
                    <label>state: <input type="text" placeholder="NSW" v-model="entry.state"/></label>
                    <label>postcode: <input type="text" placeholder="2000" v-model="entry.postcode"/></label>
                    <label>country: <input type="text" placeholder="Australia" v-model="entry.country"/></label>
                </div>
            </form>

            <div v-if="!R.equals(entry, defaultDonation)" class="flex justify-between flex-row flex-wrap">
                <Section title="Preview" class="w-100 w-50-l pa2">
                    <donation :donation="entry" />
                </Section>
                <div class="w-50 w-25-l pa2">
                    <h3>Similar Donations ({{ req.recentSimilar.map(d => d.donations.length).unwrapOr('...') }})</h3>
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
                <DonationTable :donations="req.donations.unwrap().donations" />

                <!-- <Paginate :page="req.donations.unwrap()" :on-page="(dir) => changePage(dir)">
                    <div class="mv2" v-for="donation in req.donations.unwrap().donations" :key="donation.id">
                        <Donation :donation="donation" />
                    </div>
                </Paginate> -->
            </div>
        </ui-section>
    </div>
</template>

<script lang="ts">
const JSError = Error;
import Vue from 'vue'
import * as R from 'ramda'
import { UserV1Object, SortMethod, Donation as DonationT, DonationsResp, SM, UserForFinance } from 'flux-lib/types/db';
import WebRequest from 'flux-lib/WebRequest';
import FluxLogo from '@c/common/FluxLogo.vue';
import { Error, UiSection, Donation, Paginate, EditableDate, AddressEditor, Section, StatusSuccess, Loading, DonationTable } from '@c/common';
import { Auth, Paginated } from '@/lib/api';
import { Req } from '@/lib/api';
import { eitherDo, ER } from 'flux-lib/types'

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
    extra_data: {
        comment: '',
        aud_value: 0
    },
    date: new Date().toISOString(),
    id: 'n/a'
}

export default Vue.extend({
    components: { FluxLogo, Loading, UiSection, Error, Paginate, Donation, EditableDate, AddressEditor, Section, StatusSuccess, DonationTable },
    props: {
        user: Object as () => Req<UserV1Object>,
        auth: Object as () => Auth
    },
    data: () => ({
        req: {
            donations: WebRequest.NotRequested(),
            recentSimilar: WebRequest.NotRequested(),
            saveReq: WebRequest.NotRequested(),
            checkEmail: WebRequest.NotRequested(),
        } as {
            donations: Req<DonationsResp>,
            recentSimilar: Req<DonationsResp>,
            saveReq: Req<{}>,
            checkEmail: Req<ER<UserForFinance>>
        },
        initDate: new Date() as Date,
        entry: R.clone(defaultDonation) as DonationT,
        defaultDonation,
        nSimilarDonations: 0,
        R
    }),
    methods: {
        checkEmail() {
            this.req.checkEmail = WebRequest.Loading()
            this.$flux.v2.donationAutoComplete({ ...this.auth, email: this.entry.email })
                .then(r => {
                    this.req.checkEmail = r
                    r.do({
                        success: (eu: ER<UserForFinance>) => {
                            const cases = {
                                right: (u) => {
                                    this.entry.name = [u.fname, u.mnames, u.sname].join(' ')
                                    this.entry.street = [u.addr_street_no, u.addr_street].join(' ')
                                    // @ts-ignore
                                    this.entry.city = /.+?(?= \(.{2,3}\))/.exec(u.addr_suburb)[0] || u.addr_suburb || " "
                                    // @ts-ignore
                                    this.entry.state = /\((.*?)\)$/.exec(u.addr_suburb)[0] || " "
                                    this.entry.country = u.addr_country || "Australia"
                                    this.entry.postcode = u.addr_postcode || ""
                                },
                                left: (err) => {
                                    console.log("Could not autocomplete email:", err)
                                }
                            }
                            eitherDo(eu, cases)
                        }
                    })
                })
        },
        onDateSave(newDate: Date) {
            this.entry.ts = newDate.getTime() / 1000 | 0
            this.entry.date = newDate.toISOString()
        },
        entryComplete() {
            return R.compose(R.all(p => !!p), R.values)(this.entry)
        },
        updateRecentSimilar() {
            this.req.recentSimilar = WebRequest.Loading()
            this.$flux.v2.getDonations({ ...this.auth, limit: 100, query: {amount: this.entry.amount}, sortMethod: SM.ID })
                .then(r => {
                    this.req.recentSimilar = r
                    this.nSimilarDonations = this.req.recentSimilar.unwrap().donations.length
                })
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
            const limit = _limit || 9999
            this.req.donations = WebRequest.Loading()
            this.$flux.v2.getDonations({...this.$props.auth, pageN, limit, sortMethod: SortMethod.ID}).then(r => this.req.donations = r)
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
