<template>
    <div class="mt2">
        <v-expand-transition>
            <loading v-if="isLoading()">Loading Profile Fields</loading>
        </v-expand-transition>
        <v-expand-transition>
            <div v-if="isFailed()">
                <error v-if="fieldsWR.errObj.status === 404">Profile {{type}} not found :(</error>
                <error v-else>{{fieldsWR.unwrapError()}}</error>
            </div>
        </v-expand-transition>
        <v-expand-transition>
            <div v-if="isSuccess()" class="pb2">
                <ProfileField v-for="field in fieldsWR.unwrap().fields" :field="field" :key="field.name"
                              :profile-type="type" :init-value="myProfileWR.unwrap().profile_doc[field.name]">
                </ProfileField>
            </div>
        </v-expand-transition>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {WebRequest} from "flux-lib/WebRequest";
    import ProfileField from "../common/ProfileField";

    export default Vue.extend({
        name: "UserProfile",
        components: {ProfileField},
        props: ['type',
            //{name: 'type', require: true, type: String}
        ],

        data: () => ({
            fieldsWR: WebRequest.NotRequested(),
            myProfileWR: WebRequest.NotRequested(),
        }),

        methods: {
            async getProfileFields() {
                this.$flux.profiles.getFields(this.type).then(wr => {
                    this.fieldsWR = wr;
                })
                this.$flux.profiles.getMyProfile(this.type).then(wr => {
                    this.myProfileWR = wr;
                })
            },

            isLoading() {
                return !this.isFailed() && !this.isSuccess()
            },

            isFailed() {
                return this.fieldsWR.isFailed() || this.myProfileWR.isFailed()
            },

            isSuccess() {
                return this.fieldsWR.isSuccess() && this.myProfileWR.isSuccess()
            }
        },

        created() {
            this.getProfileFields()
        }
    })
</script>

<style scoped>

</style>