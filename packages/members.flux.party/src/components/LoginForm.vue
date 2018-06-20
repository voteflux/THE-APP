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

                <div class="mt4" v-if="shouldShowAdvanced()">
                    <h5>Manual Login:</h5>
                    <input v-model.trim="advSecret" placeholder="API Token" class="mr2" />
                    <button v-on:click="advStoreSecret()">Store API Token</button>
                </div>
            </div>

        </div>
    </div>
</template>

<script lang=ts>
import Loading from "./Loading.vue";
import { mkErrContainer } from "@/lib/errors";
import { Error } from "./common/";
import { MsgBus, M } from '@/messages';
import WR from '@/lib/WebRequest';

enum Cs {
    NEED_EMAIL,
    SENDING_EMAIL,
    EMAIL_SENT
};

export default ({
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
            this.errs.email.wipe();
            this.state = Cs.SENDING_EMAIL;
            const _email = this.user.email;
            this.$flux.v1
                .sendUserDetails(this.user)
                .then(r => {
                    (this.req.login = r) && r.do({
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
                })
                .catch(e => {
                    this.state = Cs.NEED_EMAIL;
                    this.errs.email = this.$err("Error talking to server...", _email);
                    this.$unknownErr(e);
                });
        },

        advStoreSecret() {
            this.$flux.auth.saveSecret(this.advSecret)
            this.$nextTick(() => MsgBus.$emit(M.REFRESH_AUTH))
        },

        shouldShowAdvanced() {
            if (location.host.includes("localhost") || location.host.includes("ngrok.io") || location.host.includes("flux-members.netlify.com")) {
                console.log("showing advanced", location.host)
                return true;
            }
            return false;
        }
    }
});
</script>

<style scoped>
</style>
