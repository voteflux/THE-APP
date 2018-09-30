<template>
    <div class="flex flex-row justify-center">
        <div class="w-60-l w-80-ns">
            <center><h2 class="tc dib mt4 mb4"><flux-logo title="Login" :showBack="false" /></h2></center>
            <div id="form-group">
                <div v-if="state == EMAIL_SENT">
                    <h3 class="mb4">An email has been sent to you. Please check your inbox.</h3>
                    <h4 class="mb3">You can use the login code or login link in the email.</h4>

                    <v-form @submit="advStoreSecret()">
                        <v-text-field label="Your Login Code" v-model.trim="advSecret" />
                        <v-btn color="info" @click="advStoreSecret()">Login</v-btn>
                    </v-form>
                </div>

                <div v-else>
                    <v-form @submit="checkEmail()">
                        <v-text-field label="Your Email" :disabled="state != NEED_EMAIL" v-model.trim="user.email" placeholder="name@example.com" type="email" />
                        <!-- <label>
                            Email:
                            <input v-model.trim="user.email" placeholder="name@example.com" type="email" name="email" />
                        </label> -->

                        <v-btn color="info" v-show="state == NEED_EMAIL" v-on:click="checkEmail()">Continue</v-btn>
                        <Loading v-show="state == SENDING_EMAIL">Sending email...</Loading>
                    </v-form>

                    <Error v-if="errs.email.msg">
                        {{ errs.email.msg }}
                    </Error>

                    <div class="mt4" v-if="shouldShowAdvanced()">
                        <h5>Manual Login:</h5>
                        <v-form @submit="advStoreSecret()">
                            <div v-if="$flux.$dev">
                                <small><em>Hint: 'admin-password' works on dev systems</em></small>
                            </div>
                            <v-text-field label="Login Code" v-model.trim="advSecret" class="mr2 dib w-40" />
                            <v-btn color="info" v-on:click="advStoreSecret()">Login</v-btn>
                        </v-form>
                    </div>
                </div>

                <Error v-if="userReq.isFailed()" class="mt4">{{ userReq.unwrapError() }}</Error>
            </div>
        </div>
    </div>
</template>

<script lang=ts>
import Loading from "@c/common/Loading.vue";
import { mkErrContainer } from "@/lib/errors";
import { Error } from "@c/common/";
import { MsgBus, M } from "@/messages";
import WR from "flux-lib/WebRequest";
import Vue from "vue";
import * as R from 'ramda'
import { Req } from 'flux-lib/types/db'
import { UserV1Object } from "flux-lib/types/db"

enum Cs {
    NEED_EMAIL,
    SENDING_EMAIL,
    EMAIL_SENT
}

export default Vue.extend({
    name: "LoginForm",
    components: { Loading, Error },
    props: { userReq: Object as () => Req<UserV1Object> },
    // props: {
    //     userReq: {
    //         type: Object as () => Req<UserV1Object>,
    //         default: WR.NotRequested(),
    //     },
    // },
    data: () => ({
        req: {
            login: WR.NotRequested()
        },
        user: {
            email: ""
        },
        errs: mkErrContainer(),
        state: Cs.NEED_EMAIL,
        advSecret: "",
        ...Cs
    }),

    methods: {
        checkEmail() {
            this.errs.email = false;
            this.state = Cs.SENDING_EMAIL;
            const _email = this.user.email;
            this.$flux.v1.sendUserDetails(this.user).then(
                r => {
                    (this.req.login = r) &&
                        r.do({
                            failed: e => {
                                this.state = Cs.NEED_EMAIL;
                                this.errs.email = this.$err(e, _email);
                            },
                            success: r => {
                                if (r.sent_email) {
                                    this.state = Cs.EMAIL_SENT;
                                } else {
                                    this.state = Cs.NEED_EMAIL;
                                    this.errs.email = this.$err(r.reason, _email);
                                }
                            }
                        });
                },
                e => {
                    this.state = Cs.NEED_EMAIL;
                    this.errs.email = this.$err("Error talking to server...", _email);
                    this.$unknownErr(e);
                }
            );
        },

        advStoreSecret() {
            this.$flux.auth.saveSecret(this.advSecret);
            this.$nextTick(() => MsgBus.$emit(M.REFRESH_AUTH));
        },

        shouldShowAdvanced() {
            if (this.$flux.$dev) {
                console.log("showing manual login");
                return true;
            }
            return false;
        }
    }
});
</script>

<style scoped>
</style>
