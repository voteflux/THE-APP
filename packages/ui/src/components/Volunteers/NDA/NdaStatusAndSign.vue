<template>
    <transition name="fade" mode="out-in" style="min-height: 80vh">
        <Loading v-if="req.ndaStatus.isLoading()">Loading NDA Status...</Loading>
        <Error v-else-if="req.ndaStatus.isFailed()">{{ req.ndaStatus.unwrapError() }}</Error>

        <div v-else-if="req.ndaStatus.isSuccess()">
            <div v-if="req.ndaStatus.unwrap().stage === NdaStage.AWAITING_APPROVAL">
                <p>Your NDA submission is awaiting approval by a Flux staff member.</p>
                <div class="flex flex-row justify-around w-100">
                    <i-button @click="redoSubmission()">Redo or update submission</i-button>
                    <Button @click="showSignedNda()">Show Signed NDA</Button>
                </div>
                <PDFViewer :pdfMaybe="pdfURL" />
            </div>
            <div v-else-if="req.ndaStatus.unwrap().stage === NdaStage.APPROVED">
                Your NDA submission has been accepted by Flux. You are now eligable to apply for access to member details.
            </div>
            <div v-else-if="req.ndaStatus.unwrap().stage === NdaStage.NOT_APPROVED">
                Your NDA submission has been rejected. A Flux staff member should have made contact regarding this; please liaise with them, or email steerco@voteflux.org if this is otherwise unexplained.

                <p v-if="req.ndaStatus.unwrap().comment">
                    A comment was left:
                    <div class="ba pa1"> {{ req.ndaStatus.unwrap().comment }} </div>
                </p>
            </div>

            <div v-else-if="req.ndaStatus.unwrap().stage === NdaStage.NOT_STARTED">
                <transition name="fade" mode="out-in">
                    <Section title="Confidentiality Agreement" :noCollapse="true" v-if="wizardStage === WIZ.S0_UNREAD">
                        <p>Step 1: Read the confidentiality agreement below, then press next.</p>
                        <PDFViewer :pdfMaybe="pdfURL" />
                        <button @click="makeNewSig()">Next: Sign NDA</button>
                    </Section>


                    <Section title="Sign NDA" :noCollapse="true" v-else-if="wizardStage === WIZ.S1_UNSIGNED">
                        <SignNDA :onSave="onSigSave" />
                    </Section>

                    <Section v-else-if="wizardStage === WIZ.S2_UNSUBMITTED" title="Review Signature" :noCollapse="true" >
                        <div class="flex flex-column items-center justify-around">
                            <img :src="signatureImage" class="pa2 ba" width="250px" />
                            <div class="flex justify-between ma3 w-100">
                                <button class="mh2" @click="generatePdf({ useDefaultSig: true })">Show Unsigned NDA</button>
                                <button class="mh2" @click="makeNewSig()">Make New Signature</button>
                                <button class="mh2" @click="reviewFinalPdf()">Generate Signed NDA and Finalize</button>
                            </div>
                        </div>
                        <PDFViewer :pdfMaybe="pdfURL" />
                    </Section>

                    <Section v-else-if="wizardStage === WIZ.S3_REVIEW" title="Review NDA" :noCollapse="true" >
                        <Error v-if="req.ndaDraft.isFailed()">{{ req.ndaDraft.unwrapError() }}</Error>
                        <div v-else-if="req.ndaDraft.isSuccess()">
                            <PDFViewer :pdfMaybe="pdfDraft" />
                            <div class="flex flex-row justify-around w-100 ma3">
                                <button @click="reviewNegative()">Go Back</button>
                                <button @click="reviewPositive()">Submit NDA to Flux</button>
                            </div>
                            <warning>Submitting the NDA to Flux will save it to our servers</warning>
                        </div>
                        <Loading v-else>Loading signed NDA for review...</Loading>
                    </Section>

                    <Loading v-else-if="wizardStage === WIZ.S4_SUBMITTING">Submitting NDA...</Loading>

                    <Loading v-else-if="wizardStage === WIZ.S5_SUBMITTED">Submitted NDA! Refreshing status...</Loading>
                </transition>
            </div>
        </div>
    </transition>
</template>

<script lang="ts">
import Vue from 'vue'
import {genPdf} from 'flux-lib/pdfs/nda/generatePdf'
import { UserV1Object, Auth } from 'flux-lib/types';
import routes from '@/routes'
import { Maybe } from 'tsmonad';
import { yourSignaturePlaceholder } from 'flux-lib/pdfs/nda/imageUris';
import { Error, Loading, Section, PDFViewer } from "@c/common"
import WebRequest from 'flux-lib/WebRequest';
import { NdaStage, NdaDraftCommit, GenerateDraftNdaResp } from 'flux-lib/types/db/vols';
import SignNDA from './SignNDA.vue'
import { R as Req } from 'flux-lib/types/db';


enum WIZ {
    S0_UNREAD = "S0_UNREAD",
    S1_UNSIGNED = "S1_UNSIGNED",
    S2_UNSUBMITTED = "S2_UNSUBMITTED",
    S3_REVIEW = "S3_REVIEW",
    S4_SUBMITTING = "S4_SUBMITTING",
    S5_SUBMITTED = "S5_SUBMITTED"
}


export default Vue.extend({
    components: { Loading, Error, Section, SignNDA, PDFViewer },

    props: {
        user: Object as () => UserV1Object,
        auth: Object as () => Auth
    },

    data: () => ({
        req: {
            ndaStatus: WebRequest.NotRequested(),
            ndaDraft: WebRequest.NotRequested() as Req<GenerateDraftNdaResp>,
        },
        pdfBytes: new Uint8Array(0),
        pdfURL: Maybe.nothing(),
        pdfDraft: Maybe.nothing(),
        R: routes,
        NdaStage,
        wizardStage: WIZ.S0_UNREAD,
        WIZ,
    } as {
        req: { ndaDraft: Req<NdaDraftCommit> }
    } & any),

    computed: {
        signatureImage(): string {
            return this.$store.state.vol.ndaSignature.valueOr(yourSignaturePlaceholder)
        },
        signatureIsSet(): boolean {
            return (this.$store.state.vol.ndaSignature as Maybe<string>).caseOf({ nothing: () => false, just: () => true})
        },
        showPdf(): boolean {
            return this.pdfURL.caseOf({nothing: () => false, just: () => true})
        }
    },

    methods: {
        async generatePdf(opts = { useDefaultSig: false }) {
            this.pdfURL = Maybe.nothing()

            const name = `${this.user.fname} ${this.user.mnames} ${this.user.sname}`
            const addr = `${this.user.addr_street_no} ${this.user.addr_street}, ${this.user.addr_suburb}, ${this.user.addr_postcode}, Australia`
            const sig = opts.useDefaultSig === true ? yourSignaturePlaceholder : this.signatureImage
            const result = await genPdf(name, addr, sig)

            this.pdfURL = Maybe.just(result.uri)
        },

        redoSubmission() {
            this.req.ndaStatus = WebRequest.Success({ stage: NdaStage.NOT_STARTED })
            this.generatePdf({ useDefaultSig: false })
        },

        showSignedNda() {
            this.pdfURL = Maybe.just(this.req.ndaStatus.unwrap().pdfDataUri)
        },

        makeNewSig() {
            // this.$router.push({path: routes.VolunteerSignNDA})
            this.wizardStage = WIZ.S1_UNSIGNED
            this.pdfURL = Maybe.nothing()
        },

        onSigSave(sig) {
            this.wizardStage = WIZ.S2_UNSUBMITTED
            this.pdfURL = Maybe.nothing()
        },

        reviewFinalPdf() {
            this.req.ndaDraft = WebRequest.Loading()
            this.wizardStage = WIZ.S3_REVIEW
            this.$flux.v2.generateDraftPdf(this.auth, { sigPng: this.signatureImage })
                .then(r => {
                    this.req.ndaDraft = r
                    this.pdfDraft = Maybe.just(r.unwrap().pdfData)
                })
        },

        reviewNegative() {
            this.wizardStage = WIZ.S2_UNSUBMITTED
            this.pdfDraft = Maybe.nothing()
        },

        reviewPositive() {
            this.wizardStage = WIZ.S4_SUBMITTING
            const pdf = this.pdfURL.valueOr('')
            this.pdfURL = Maybe.nothing()
            // this.$flux.v2.submitNdaPdfAndSignature({ ...this.auth, pdf, sig: this.signatureImage})
            //     .then(() => {
            //         this.wizardStage = WIZ.S0_UNREAD
            //         this.loadNdaStatus()
            //     })
        },

        loadNdaStatus() {
            this.pdfURL = Maybe.nothing()
            this.req.ndaStatus = WebRequest.Loading()
            return this.$flux.v2.getNdaStatus(this.auth).then(r => {
                this.req.ndaStatus = r
                return r
            })
        }
    },

    created() {
        this.loadNdaStatus()
            .then(r => {
                if (r.isSuccess() && r.unwrap().stage === NdaStage.NOT_STARTED) {
                    this.generatePdf({ useDefaultSig: true })
                }
            })
    }
})
</script>

<style lang="sass" scoped>

</style>
