<template>
    <div>
        <h3>Login to Flux UI</h3>
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
            </div>

        </div>
    </div>
</template>

<script lang=ts>
import Loading from "./Loading.vue";
import { mkErrContainer } from "../lib/errors";
import { Error } from "./common/";

const cs = {
    NEED_EMAIL: 1,
    SENDING_EMAIL: 2,
    EMAIL_SENT: 3
};

export default {
    name: "LoginForm",
    components: { Loading, Error },
    data: () => ({
        user: {
            email: ""
        },
        errs: mkErrContainer(),
        state: cs.NEED_EMAIL,
        ...cs
    }),

    methods: {
        checkEmail() {
            this.errs.email.wipe();
            this.state = cs.SENDING_EMAIL;
            const _email = this.user.email;
            this.$flux.v1
                .sendUserDetails(this.user)
                .then(r => {
                    r.caseOf({
                        left: e => {
                            this.state = cs.NEED_EMAIL;
                            this.errs.email = this.$err(e, _email);
                        },
                        right: r => {
                            if (r.sent_email) {
                                this.state = cs.EMAIL_SENT;
                            } else {
                                this.state = cs.NEED_EMAIL;
                                this.errs.email = this.$err(r.reason, _email);
                            }
                        }
                    });
                })
                .catch(e => {
                    this.state = cs.NEED_EMAIL;
                    this.errs.email = this.$err("Error talking to server...", _email);
                    this.$unknownErr(e);
                });
        }
    }
};
</script>

<style scoped>
</style>
