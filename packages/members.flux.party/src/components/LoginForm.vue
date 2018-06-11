<template>
    <div>
        <flux-logo title="Login"/>
        <div id="form-group">

            <div v-if="state == EMAIL_SENT">
                <h3>An email has been sent to you. Please check your inbox.</h3>
            </div>

            <div v-else>
                <label>
                    Email:
                    <input v-model.trim="user.email" placeholder="name@example.com" type="email" name="email" />
                </label>
                <error v-show="errs.email.msg">
                    {{ errs.email.msg }}
                </error>

                <p>
                    <button v-show="state == NEED_EMAIL" v-on:click="checkEmail()">Continue</button>
                    <Loading v-show="state == SENDING_EMAIL">Sending email...</Loading>
                </p>

                <p class="mt4" v-if="shouldShowAdvanced()">
                    <h5>Debug only:</h5>
                    <input v-model.trim="advSecret" placeholder="API Token" class="mr2"/>
                    <button v-on:click="advStoreSecret()">Store API Token</button>
                </p>
            </div>

        </div>
    </div>
</template>

<script lang=ts>
import Loading from "./Loading.vue";
import { mkErrContainer } from "../lib/errors";
import { Error } from "./common/";

enum Cs {
    NEED_EMAIL,
    SENDING_EMAIL,
    EMAIL_SENT
};

export default {
    name: "LoginForm",
    components: { Loading, Error },
    data: () => ({
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
            this.errs.email.wipe();
            this.state = Cs.SENDING_EMAIL;
            const _email = this.user.email;
            this.$flux.v1
                .sendUserDetails(this.user)
                .then(r => {
                    r.caseOf({
                        left: e => {
                            this.state = Cs.NEED_EMAIL;
                            this.errs.email = this.$err(e, _email);
                        },
                        right: r => {
                            if (r.sent_email) {
                                this.state = Cs.EMAIL_SENT;
                            } else {
                                this.state = Cs.NEED_EMAIL;
                                this.errs.email = this.$err(r.reason, _email);
                            }
                        }
                    });
                })
                .catch(e => {
                    this.state = Cs.NEED_EMAIL;
                    this.errs.email = this.$err("Error talking to server...", _email);
                    this.$unknownErr(e);
                });
        },

        advStoreSecret() {
            localStorage.setItem('s', this.advSecret);
            location.reload();
        },

        shouldShowAdvanced() {
            if (location.host.includes("localhost") || location.host.includes("ngrok.io") || location.host.includes("flux-members.netlify.com")) {
                return true;
            }
            return false;
        }
    }
};
</script>

<style scoped>
</style>
