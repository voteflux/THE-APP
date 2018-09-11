<template>
    <div>
        <flux-logo title="Login" :showBack="false" />
        <div id="form-group">

            <div v-if="state == EMAIL_SENT">
                <h3>An email has been sent to you. Please check your inbox.</h3>
                <h5>You can use the login code or login link in the email.</h5>
                <hr>
                <form @submit="advStoreSecret()">
                    <label>
                        Please enter your login code:<br>
                        <input type="text" v-model.trim="advSecret" placeholder="a7b3f..." />
                    </label>
                </form>
            </div>

            <div v-else>
                <label>
                    Email:
                    <input v-model.trim="user.email" placeholder="name@example.com" type="email" name="email" />
                </label>
                <error v-if="errs.email.msg">
                    {{ errs.email.msg }}
                </error>

                <p>
                    <button v-show="state == NEED_EMAIL" v-on:click="checkEmail()">Continue</button>
                    <Loading v-show="state == SENDING_EMAIL">Sending email...</Loading>
                </p>

                <div class="mt4" v-if="shouldShowAdvanced()">
                    <h5>Manual Login:</h5>
                    <form @submit="advStoreSecret()">
                        <div v-if="$flux.$dev">
                            <small><em>Hint: 'admin-password' works on dev systems</em></small>
                        </div>
                        <input v-model.trim="advSecret" placeholder="Login Code" class="mr2" />
                        <button v-on:click="advStoreSecret()">Login</button>
                    </form>
                </div>
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

enum Cs {
    NEED_EMAIL,
    SENDING_EMAIL,
    EMAIL_SENT
}

export default Vue.extend({
    name: "LoginForm",
    components: { Loading, Error },
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
