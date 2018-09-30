<template>
    <UiSection title="Self Validation of Electoral Roll Details">
        <div v-if="state == UNINITIALIZED">
            <h4>Loading validation...</h4>
        </div>

        <div v-else-if="state == STARTING_SESSION">
            <h4>Initializing... can take a few seconds</h4>
        </div>

        <div v-else-if="state == AWAITING_CAPTCHA">
            <h4>Please enter the CAPTCHA below</h4>
            <img :src="captchaImg" style="min-height: 50px; min-width: 200px" class="db">
            <v-text-field autofocus class="pa2 w-100 mt2" type="text" v-model="captchaAnswer" v-on:keyup.enter="submitCaptcha()" placeholder="Please enter the CAPTCHA" />
            <v-btn color="success" class="db pa2 mv2" v-if="captchaAnswer.length == 4" v-on:click="submitCaptcha()">Submit CAPTCHA</v-btn>
        </div>

        <div v-else-if="state == SENT_CAPTCHA">
            <h4>Awaiting CAPTCHA response...</h4>
        </div>

        <div v-else-if="state == GOT_RESULT || hasFinalResult">
            <div v-if="validationSuccess">
                <p>Your details are valid 🙂, thanks!</p>
                <router-link :to="R.Dashboard">Back to Dashboard</router-link>
            </div>
            <div v-else>
                <h3>Your details were not valid! The reason was:</h3>

                <Error class="mt3 mb3">{{ validationReason }}</Error>

                <div class="mt4">
                    <div v-if="captchaStatus == false">
                        <v-btn color="info" class="btn db mv2 pa2" v-on:click="startAgain()">Try Again</v-btn>
                    </div>

                    <div v-else class="flex justify-around">
                        <v-btn @click="toDashboard()">Back to Dashboard</v-btn>
                        <v-btn color="info" @click="toEditDetails()">Update Details Now</v-btn>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="state == SOCKET_CLOSED">
            Connection lost.
            <v-btn color="info" class="btn db mv2 pa2" v-on:click="startAgain()">Reconnect</v-btn>
        </div>

        <div v-else> <!-- "state == ERROR" -->
            <p>
                Oh no! An error!
            </p>
            <Error v-show="err.socket.msg">{{ err.socket.msg }}</Error>
            <v-btn color="warning" class="btn db mv2 pa2" v-on:click="startAgain()">Try Again?</v-btn>
            <router-link :to="R.Dashboard">Back to Dashboard</router-link>
        </div>
    </UiSection>
</template>

<script lang="ts">
import Vue from "vue";
import { UiSection } from "@c/common";
import { mkErrContainer } from "../lib/errors";
import { Error } from "@c/common";
import { M, MsgBus } from "../messages";
import R from "../routes";

enum Cs {
    UNINITIALIZED,
    STARTING_SESSION,
    AWAITING_CAPTCHA,
    SENT_CAPTCHA,
    GOT_RESULT,
    SOCKET_CLOSED,
    ERROR
}

export default Vue.extend({
    components: { UiSection, Error },
    props: ["auth"],
    data: () => ({
        state: Cs.UNINITIALIZED,
        socket: undefined as undefined | WebSocket,
        msgHandlers: {finish: msg => {}, deliver_session: ({session}) => {}},
        validationSuccess: false,
        validationReason: "",
        sessionImg: new Image(),
        session: null,
        captchaAnswer: "",
        captchaImg: "",
        captchaStatus: false,
        err: mkErrContainer(),
        hasFinalResult: false,
        R,
        ...Cs
    }),
    methods: {
        toDashboard() {
            this.$router.push(R.Dashboard)
        },
        toEditDetails() {
            this.$router.push(R.EditUserDetails)
        },
        setupHandlers() {
            this.msgHandlers = {
                finish: msg => {
                    this.state = Cs.GOT_RESULT;
                    this.hasFinalResult = true;
                    this.validationSuccess = msg.success;
                    this.captchaStatus = !msg["captcha_incorrect"];
                    this.validationReason = msg.validationReason;
                    this.captchaAnswer = "";
                    MsgBus.$emit(M.REFRESH_USER, {silent: true});
                },
                deliver_session: ({ session }) => {
                    this.session = session;
                    this.state = Cs.AWAITING_CAPTCHA;
                    if (this.$refs.captcha)
                        this.$nextTick(() => (<HTMLElement>this.$refs.captcha).focus())
                    this.captchaImg = this.$flux.utils.captchaImgUrl(session);
                    this.sessionImg = new Image();
                    this.sessionImg.src = this.captchaImg;
                }
            };
        },
        setupSocket() {
            if (this.socket && this.socket.readyState <= 1) {
                return;
            }
            this.socket = this.$flux.v1.validationWebsocket();

            this.socket.onopen = () => {
                this.sendInit();
            };
            this.socket.onclose = () => {
                // if we've successfully validated then this doesn't matter
                if (this.validationSuccess != true) this.state = Cs.SOCKET_CLOSED;
            };

            this.socket.onmessage = this.onSocketMessage;

            this.socket.onerror = e => {
                this.err.socket = this.$err(JSON.stringify(e), e);
                this.state = Cs.ERROR;
            };
        },
        sendJson(toSend) {
            if (this.socket)
                this.socket.send(JSON.stringify(toSend));
        },
        sendInit() {
            this.state = Cs.STARTING_SESSION;
            this.sendJson({
                method: "begin",
                selfValidation: true,
                forceValitation: true, // just debug
                s: this.$props.auth.s
            });
        },
        onSocketMessage(evt) {
            const msg = JSON.parse(evt.data);
            if (msg.status == "error") this.onSocketError(msg);
            else this.msgHandlers[msg.method](msg);
        },
        onSocketError(msg) {
            this.err.socket = this.$err(msg.msg, msg);
            this.state = Cs.ERROR;
        },
        submitCaptcha() {
            this.sendJson({
                method: "captcha_answer",
                captcha: this.captchaAnswer,
                session: this.session
            });
            this.state = Cs.SENT_CAPTCHA;
        },
        startAgain() {
            this.state = Cs.UNINITIALIZED;
            this.hasFinalResult = false;
            this.setupSocket();
            this.sendInit();
        }
    },
    created() {
        this.setupHandlers();
        this.setupSocket();
    }
});
</script>

<style scoped>
</style>
