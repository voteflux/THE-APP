<template>
    <transition name="fade" mode="out-in" style="min-height: 80vh">
        <Loading v-if="req.ndaStatus.isLoading()">Loading NDA Status...</Loading>
        <Error v-else-if="req.ndaStatus.isFailed()">{{ req.ndaStatus.unwrapError() }}</Error>

        <transition name="fade" mode="out-in" v-else-if="req.ndaStatus.isSuccess()">
            <div v-if="req.ndaStatus.unwrap().stage === NdaStage.AWAITING_APPROVAL" :key="NdaStage.AWAITING_APPROVAL">
                <p>Your NDA submission is awaiting approval by a Flux staff member.</p>
                <div class="flex flex-row justify-around w-100">
                    <v-btn color="warning" @click="redoSubmission()">Redo or update submission</v-btn>
                    <v-btn color="info" @click="showSignedNda()">Show Signed NDA</v-btn>
                </div>
                <PDFViewer :pdfMaybe="signedPdf" :title="`Signed NDA (on file, ${userO.fullName()})`" />
            </div>

            <div v-else-if="req.ndaStatus.unwrap().stage === NdaStage.APPROVED" :key="NdaStage.APPROVED">
                Your NDA submission has been accepted by Flux. You are now eligible to apply for access to member details.
            </div>

            <div v-else-if="req.ndaStatus.unwrap().stage === NdaStage.NOT_APPROVED" :key="NdaStage.NOT_APPROVED">
                Your NDA submission has been rejected. A Flux staff member should have made contact regarding this; please liaise with them, or email steerco@voteflux.org if this is otherwise unexplained.

                <p v-if="req.ndaStatus.unwrap().comment">
                    A comment was left:
                    <span class="ba pa1 db"> {{ req.ndaStatus.unwrap().comment }} </span>
                </p>
            </div>

            <div v-else-if="req.ndaStatus.unwrap().stage === NdaStage.NOT_STARTED" :key="NdaStage.NOT_STARTED">
                <transition name="fade" mode="out-in">
                    <Section title="Confidentiality Agreement" :noCollapse="true" v-if="wizardStage === WIZ.S0_UNREAD" :key="WIZ.S0_UNREAD">
                        <p>Step 1: Read the confidentiality agreement below, then press next.</p>
                        <PDFViewer :pdfMaybe="unsignedPdf" title="Unsigned NDA" />
                        <div class="tr">
                            <v-btn color="success" @click="makeNewSig()">Next: Sign NDA</v-btn>
                        </div>
                    </Section>


                    <Section title="Sign NDA" :noCollapse="true" v-else-if="wizardStage === WIZ.S1_UNSIGNED" :key="WIZ.S1_UNSIGNED">
                        <SignNDA :onSave="onSigSave" :onBack="onSigBack" />
                    </Section>

                    <Section v-else-if="wizardStage === WIZ.S2_UNSUBMITTED"  :key="WIZ.S2_UNSUBMITTED" title="Review Signature" :noCollapse="true" >
                        <div class="flex flex-column items-center justify-around">
                            <img :src="signatureImage" class="pa2 ba" width="250px" />
                            <div class="flex justify-between ma3 w-100">
                                <v-btn color="info" class="mh2" @click="generateDraftPdf({ useDefaultSig: true })">Show Unsigned NDA</v-btn>
                                <v-btn color="" class="mh2" @click="makeNewSig()">Make New Signature</v-btn>
                                <v-btn color="success" class="mh2" @click="reviewFinalPdf()">Generate Signed NDA & Review</v-btn>
                            </div>
                        </div>
                        <PDFViewer :pdfMaybe="unsignedPdf" title="Unsigned NDA" />
                    </Section>

                    <Section v-else-if="wizardStage === WIZ.S3_REVIEW" :key="WIZ.S3_REVIEW" title="Review NDA" :noCollapse="true" >
                        <transition name="fade" mode="out-in">
                            <div :key="'nda-rev-error'" v-if="req.ndaDraft.isFailed()">
                                <Error>{{ req.ndaDraft.unwrapError() }}</Error>
                                <v-btn color="info" class="mt2" @click="reviewNegative()">Go Back and Try Again</v-btn>
                            </div>
                            <div :key="'nda-rev-succ'" v-else-if="req.ndaDraft.isSuccess()">
                                <PDFViewer :pdfMaybe="draftPdf" title="Signed NDA (unsubmitted)" />
                                <div class="flex flex-row justify-around w-100 ma3">
                                    <v-btn color="info" @click="reviewNegative()">Go Back</v-btn>
                                    <v-btn color="success" @click="reviewPositive()">Submit NDA to Flux</v-btn>
                                </div>
                                <warning>Submitting the NDA to Flux will save it to our servers</warning>
                            </div>
                            <Loading :key="'nda-rev-loading'" v-else>Loading signed NDA for review...</Loading>
                        </transition>
                    </Section>

                    <Loading v-else-if="wizardStage === WIZ.S4_SUBMITTING" :key="WIZ.S4_SUBMITTING">Submitting NDA...</Loading>

                    <Loading v-else-if="wizardStage === WIZ.S5_SUBMITTED" :key="WIZ.S5_SUBMITTED">Submitted NDA! Refreshing status...</Loading>
                </transition>
            </div>
        </transition>
    </transition>
</template>

<script lang="ts">
import Vue from 'vue'
import { UserV1Object, Auth } from 'flux-lib/types/db';
import routes from '@/routes'
import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'
import { yourSignaturePlaceholder } from 'flux-lib/pdfs/nda/imageUris';
import { Error, Loading, CollapsibleSection, PDFViewer } from "@c/common"
import WebRequest from 'flux-lib/WebRequest';
import { NdaStage, NdaDraftCommit, GenerateDraftNdaResp, NdaStatus } from 'flux-lib/types/db/vols'
import SignNDA from './SignNDA.vue'
import { R as Req } from 'flux-lib/types/db';
import { uint8aToBase64, strToUint8a } from 'flux-lib/utils/index'
import sha256 from 'fast-sha256'
import { uriHash } from 'flux-lib/pdfs/index'
import { UserObject } from '@/lib/UserObject'


enum WIZ {
    S0_UNREAD = "S0_UNREAD",
    S1_UNSIGNED = "S1_UNSIGNED",
    S2_UNSUBMITTED = "S2_UNSUBMITTED",
    S3_REVIEW = "S3_REVIEW",
    S4_SUBMITTING = "S4_SUBMITTING",
    S5_SUBMITTED = "S5_SUBMITTED"
}


export default Vue.extend({
    components: { Loading, Error, Section: CollapsibleSection, SignNDA, PDFViewer },

    props: {
        user: Object as () => UserV1Object,
        userO: UserObject,
        auth: Object as () => Auth,
    },

    data: () => ({
        req: {
            ndaStatus: WebRequest.NotRequested(),
            ndaDraft: WebRequest.NotRequested() as Req<GenerateDraftNdaResp>,
            ndaSubmit: WebRequest.NotRequested() as Req<GenerateDraftNdaResp>,
        },
        pdfBytes: new Uint8Array(0),
        unsignedPdf: none,
        signedPdf: none,
        draftPdf: none,
        R: routes,
        NdaStage,
        wizardStage: WIZ.S0_UNREAD,
        WIZ,
    } as {
        req: { ndaDraft: Req<NdaDraftCommit> }
    } & any),

    computed: {
        signatureImage(): string {
            return this.$store.state.vol.ndaSignature.getOrElse(yourSignaturePlaceholder)
        },
        sigHash(): string {
            return uriHash(this.$store.state.vol.ndaSignature.getOrElseL(() => { throw new Error() }))
        },
        signatureIsSet(): boolean {
            return isSome(this.$store.state.vol.ndaSignature as Option<string>)
        }
    },

    methods: {
        async generateDraftPdf(opts = { useDefaultSig: false }) {
            console.log("DRAFT_PDF: Starting");
            const name = this.userO.fullName();
            const addr = this.userO.formalAddress();
            const sig = opts.useDefaultSig ? yourSignaturePlaceholder : this.signatureImage;
            console.log("DRAFT_PDF: Importing genPdf");
            const {genPdf} = await import('flux-lib/pdfs/nda/generatePdf');
            console.log("DRAFT_PDF: Running genPdf");
            const result = await genPdf(name, addr, sig);
            this.draftPdf = some(result.uri);
            console.log("DRAFT_PDF: Finished")
            return this.draftPdf
        },

        redoSubmission() {
            this.req.ndaStatus = WebRequest.Success({ stage: NdaStage.NOT_STARTED })
            this.generateDraftPdf({ useDefaultSig: true })
        },

        showSignedNda() {
            this.signedPdf = some(this.req.ndaStatus.unwrap().pdfDataUri)
        },

        makeNewSig() {
            this.wizardStage = WIZ.S1_UNSIGNED
        },

        onSigSave(sig) {
            this.wizardStage = WIZ.S2_UNSUBMITTED
        },

        onSigBack() {
            this.wizardStage = WIZ.S0_UNREAD
        },

        reviewFinalPdf() {
            this.draftPdf = none
            this.req.ndaDraft = WebRequest.Loading()
            this.wizardStage = WIZ.S3_REVIEW
            this.$flux.v2.ndaGenerateDraftPdf(this.auth, { sigPng: this.signatureImage })
                .then(r => {
                    this.req.ndaDraft = r
                    this.draftPdf = some(r.unwrap().pdfData)
                })
        },

        reviewNegative() {
            this.wizardStage = WIZ.S2_UNSUBMITTED
            this.draftPdf = none
        },

        reviewPositive() {
            this.wizardStage = WIZ.S4_SUBMITTING
            this.req.ndaStatus = WebRequest.Loading()
            const { pdfHash, sigHash } = this.req.ndaDraft.caseOfDefault({
                success: d => d,
                default: () => new Proxy({}, { get: () => "NULL" })
            })
            const mySigHash = this.sigHash()
            if (sigHash !== mySigHash) {
                this.req.ndaSubmit = WebRequest.Failed("Protocol failure between Flux UI and backend: The hash of your signature calculated by the UI and by the Flux backend is different. This is unexpected but probably okay. Please try again and let us know at feedback@app.flux.party if this keeps happening.")
                return
            }
            this.$flux.v2.ndaFinalizeSubmission(this.auth, {pdfHash, sig: this.signatureImage, sigHash: this.sigHash()})
                .then((ret) => {
                    this.wizardStage = WIZ.S0_UNREAD
                    this.req.ndaSubmit = ret
                    this.loadNdaStatus()
                })
        },

        loadNdaStatus() {
            this.unsignedPdf = this.draftPdf = none
            this.req.ndaStatus = WebRequest.Loading()
            return this.$flux.v2.getNdaStatus(this.auth).then(r => {
                this.req.ndaStatus = r as Req<NdaStatus>
                return r
            })
        }
    },

    mounted() {
        this.loadNdaStatus()
            .then(async r => {
                if (r.isSuccess() && r.unwrap().stage === NdaStage.NOT_STARTED) {
                    this.unsignedPdf = await this.generateDraftPdf({ useDefaultSig: true })
                }
            })
    }
})
</script>

<style lang="sass" scoped>

</style>
