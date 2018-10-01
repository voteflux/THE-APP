<template>
    <UiSection title="Revoke your Membership" :dangerZone="true">
        <Warning>
            This will remove all your data from our database.<br>
            To undo this you'll need to sign up again.<br>
            There is no going back.
        </Warning>

        <error v-if="this.err.revoke.msg">
            {{ this.err.revoke.msg }}
        </error>
        {{ this.err.revoke.msg }}

        <transition name="fade" mode="out-in" class="mv3">
            <router-link :to="R.Dashboard" v-show="state != DONE">Take me back to safety.</router-link>
        </transition>

        <div class="mt4">
            <h3>Revocation</h3>
            <transition name="fade" mode="out-in">
                <div v-if="state == AT_START" :key="AT_START">
                    <v-btn color="error" v-on:click="startRevocation()">Revoke my Membership</v-btn>
                </div>
                <div v-else-if="state == CONFIMATION" :key="CONFIMATION">
                    <h4>Please confirm by filling out:</h4>
                    <label class="db">Your Email ({{ user.email }})</label><br>
                    <input class="db" type="email" v-model="formEmail" placeholder="confirm your email"/>
                    <v-btn color="error" class="mt2" :disabled="formEmail !== user.email" v-on:click="confirmRevocation()">Revoke my Membership</v-btn>
                </div>
                <div v-else-if="state == CONFIRMATION_2" :key="CONFIRMATION_2">
                    <h4>Last Step:</h4>
                    <v-btn color="error" class="mt3 danger-btn db" v-on:click="doRevocationFinally()">Revoke my Membership</v-btn>
                    <v-btn color="success" class="mt4 db" v-on:click="cancelRevocation()">Cancel - Take me to safety</v-btn>
                </div>
                <div v-else-if="state == SAVING" :key="SAVING">
                    <h4>Revoking membership...</h4>
                </div>
                <div v-else-if="state == DONE" :key="DONE">
                    <h4>Your membership has been revoked. You should recieve a confirmation email.</h4>
                    <v-btn color="success" class="db mt2" v-on:click="checkMembership()">Okay</v-btn>
                </div>
            </transition>
        </div>
    </UiSection>
</template>

<script lang="ts">
import Vue from "vue";
import { UiSection } from "@c/common";
import { mkErrContainer } from "../lib/errors";
import { Error, Warning } from "@c/common";
import { M, MsgBus } from "../messages";
import R from "../routes";

enum Cs {
    AT_START,
    CONFIMATION,
    CONFIRMATION_2,
    SAVING,
    DONE,
}

export default Vue.extend({
    components: { UiSection, Error, Warning },
    props: ["auth", "user"],
    data: () => ({
        err: mkErrContainer(),
        state: Cs.AT_START,
        formEmail: "",
        R,
        ...Cs
    }),
    methods: {
        init() {
            this.formEmail = ""
            this.state = Cs.AT_START
        },
        startRevocation() {
            this.formEmail = ""
            this.state = Cs.CONFIMATION
        },
        confirmRevocation() {
            this.state = Cs.CONFIRMATION_2
        },
        doRevocationFinally() {
            this.state = Cs.SAVING
            this.$flux.v1.revokeMembership(this.$props.user)
                .then((r) => r.do({
                    failed: (e, errObj) => {
                        if (errObj.status == 403) {
                            this.err.revoke = this.$err("Unauthorized... Have you already revoked your membership?", e)
                        } else {
                            this.err.revoke = this.$unknownErr(e)
                        }
                    },
                    success: () => this.state = Cs.DONE
                }))
        },
        cancelRevocation() {
            this.init()
        },
        checkMembership() {
            MsgBus.$emit(M.REFRESH_USER)
        }
    },
    created() {
    }
});
</script>

<style lang="scss" scoped>
@import "tachyons-sass/tachyons.scss";

.danger-btn {
    @extend .bg-dark-red;
    @extend .white;
}

.danger-btn:disabled {
    background-color: #6300007c;
}
</style>
