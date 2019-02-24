<template>
        <div>
            <v-expand-transition>
                <loading v-if="isLoading()">Loading Profile Fields</loading>
            </v-expand-transition>
            <v-expand-transition>
                <div v-if="fieldsWR.isFailed()">
                    <div v-if="fieldsWR.errObj && fieldsWR.errObj.status === 404"><v-btn color="success" @click="visitProfile()">Create your {{ type }} profile</v-btn></div>
                    <error v-else>{{fieldsWR.unwrapError()}}</error>
                </div>
            </v-expand-transition>
            <v-expand-transition>
                <div v-if="fieldsWR.isSuccess()" class="pb2">
                    <div v-if="myProfileWR.isSuccess()">
                        <div v-if="myProfileWR.unwrap().is_empty">
                            <v-btn color="success" @click="visitProfile()">Create your {{ type }} profile</v-btn>
                        </div>
                        <div v-else>
                            <v-btn color="info" @click="visitProfile()">Edit/Update {{ type }} Profile</v-btn>
                        </div>
                    </div>
                    <div v-else-if="myProfileWR.isFailed()">
                        <error>{{myProfileWR.unwrapError()}}</error>
                    </div>
                    <loading v-else>Loading Profile</loading>
                </div>
            </v-expand-transition>
        </div>
</template>

<script>
    import Vue from 'vue';
    import {WebRequest} from "flux-lib/WebRequest";
    import ProfileField from "../common/ProfileField";
    import R from "../../routes"

    export default Vue.extend({
        name: "UserProfile",
        components: {ProfileField},
        props: [
            'type'
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
                    if (wr.errObj && wr.errObj.status === 404) {
                        this.myProfileWR = WebRequest.Success({profile_type: this.type, profile_doc: {}, is_empty: true})
                    } else {
                        this.myProfileWR = wr;
                    }
                })
            },

            visitProfile() {
                this.$router.push(R.ProfileEdit.replace(':type', this.type))
                console.log(R.ProfileEdit.replace(':type', this.type))
            },

            isLoading() {
                return !this.isFailed() && !this.isSuccess()
            },

            isFailed() {
                return this.fieldsWR.isFailed()
            },

            isSuccess() {
                return this.fieldsWR.isSuccess() && (this.myProfileWR.isSuccess() || (this.myProfileWR.isFailed() && this.myProfileWR.unwrapError().status === 404))
            }
        },

        created() {
            this.getProfileFields()
        }
    })
</script>

<style scoped>

</style>