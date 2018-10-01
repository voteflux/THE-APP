<template>
    <div>
        <ui-section title="Enter Donation">
            <form @submit="saveDonation()" class="flex flex-wrap">
                <div class="w-50-l w-100">
                    <flux-input label="E-mail">
                        <v-text-field required v-model="entry.email" :rules="emailRules" :loading="req.checkEmail.isLoading()" @change="checkEmail()" />
                    </flux-input>
                    <!-- <label>email:
                        <fa-icon v-if="req.checkEmail.isLoading()" icon="spinner" class="fa-spin" />
                        <input @change="checkEmail()" type="text" placeholder="name@example.com" v-model="entry.email"/>
                    </label> -->
                    <!-- <label>branch: <input type="text" placeholder="/AUS" v-model="entry.branch"/></label> -->
                    <flux-input label="Branch"><v-autocomplete :items="validJuris" v-model="entry.branch" required /></flux-input>
                    <flux-input :label="`Amount (${entry.unit}) ${ req.recentSimilar.isSuccess() ? '| (' + nSimilarDonations + ' similar)' : '' }`">
                        <v-text-field type="number" v-model.number="entry.amount" @change="updateRecentSimilar()" :loading="req.recentSimilar.isLoading()" required />
                    </flux-input>
                    <flux-input label="Donation Units (e.g. AUD)"><v-text-field v-model="entry.units" required /></flux-input>
                    <div v-if="entry.unit.toUpperCase() !== 'AUD'">
                        <flux-input label="AUD valid of donation"><v-text-field v-model="entry.extra_data.aud_value" type="number" required /></flux-input>
                    </div>
                    <!-- <editable-date name="Date" :initDate="initDate" :onSave="onDateSave" :autoSave="true" /> -->
                    <flux-input label="Date (DD/MM/YYYY)">
                        <v-menu
                            ref="donationDateMenu"
                            :close-on-content-click="false"
                            v-model="donationDateMenuOpen"
                            :nudge-right="40"
                            lazy
                            transition="scale-transition"
                            offset-y
                            full-width
                            max-width="290px"
                            min-width="290px"
                            class="w-100"
                        >
                            <v-text-field
                                slot="activator"
                                v-model="tmpFormattedDate"
                                @blur="parseDate()"
                            />
                            <v-date-picker v-model="entry.date" no-title @input="datePickerSave()"></v-date-picker>
                        </v-menu>
                    </flux-input>
                    <flux-input label="Payment Source">
                        <v-autocomplete
                            :items="paymentSourceItems"
                            v-model="entry.payment_source"
                            required
                        />
                    </flux-input>
                    <flux-input label="Comment (optional)">
                        <v-textarea
                            placeholder="Any relevant details we might want in future."
                            v-model="entry.extra_data.comment"
                            :rows="3"
                        />
                    </flux-input>
                </div>
                <div class="w-50-l w-100">
                    <flux-input label="Full Name"><v-text-field v-model="entry.name" required /></flux-input>
                    <flux-input label="Street"><v-text-field v-model="entry.street" required /></flux-input>
                    <flux-input label="City"><v-text-field v-model="entry.city" required /></flux-input>
                    <flux-input label="State"><v-text-field v-model="entry.state" required /></flux-input>
                    <flux-input label="Postcode"><v-text-field v-model="entry.postcode" required /></flux-input>
                    <flux-input label="Country"><v-text-field v-model="entry.country" required /></flux-input>
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
                        <v-btn color="success" @click="saveDonation()">Save and send email receipt</v-btn>
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

        <ui-section title="Recently Entered Donations (sorted by DB _ID; descending)">
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

<script type="text/x-template" id="flx-input-template">
</script>

<script lang="ts">
const JSError = Error;
import Vue from 'vue'
import * as R from 'ramda'
import { UserV1Object, SortMethod, Donation as DonationT, DonationsResp, SM, UserForFinance } from 'flux-lib/types/db';
import { validJuris } from 'flux-lib/types/db/api'
import WebRequest from 'flux-lib/WebRequest';
import FluxLogo from '@c/common/FluxLogo.vue';
import { Error, UiSection, Donation, Paginate, EditableDate, AddressEditor, Section, StatusSuccess, Loading, DonationTable } from '@c/common';
import { Auth, Paginated } from '@/lib/api';
import { Req } from '@/lib/api';
import { eitherDo, ER } from 'flux-lib/types'
import { nameRules, emailRules } from '@/lib/forms'


const paymentSourceItems = [
    { text: "Bank Transfer", value: "eft" },
    { text: "PayPal", value: "paypal"},
    { text: "Cryptocurrency", value: "crypto" }
]


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
        R,
        emailRules,
        nameRules,
        validJuris,
        paymentSourceItems,
        tmpFormattedDate: '',
        donationDateMenuOpen: false,
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
        datePickerSave() {
            if (this.entry.date) {
                const [year, month, day] = this.entry.date.split("-")
                this.entry.ts = (new Date(parseInt(year), parseInt(month)-1, parseInt(day))).getTime() / 1000 | 0
                this.tmpFormattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
            }
            this.donationDateMenuOpen = false
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
            this.$flux.v2.getDonations({...this.$props.auth, pageN, limit, sortMethod: SortMethod.ID})
                .then(r => this.req.donations = r)
        },
        parseDate() {
            if (!this.tmpFormattedDate) return null
            const [day, month, year] = this.tmpFormattedDate.split('/')
            this.entry.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
    },
    mounted() {
        this.getDonations()
    }
})
</script>

<style scoped lang="scss">
.container {
    padding: 0;
}
</style>
