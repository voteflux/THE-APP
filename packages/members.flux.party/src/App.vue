<template>
    <div id="app" class="w-100 w-90-m w-80-l center mb4">
        <notifications/>

        <MenuBar class=""/>

        <transition name="fade" mode="out-in">
            <Loading v-if="req.user.isLoading()" :key="IS_LOGGING_IN">
                Checking login details...
            </Loading>

            <div v-else-if="req.user.isSuccess()" :key="IS_LOGGED_IN">
                <transition name="fade" mode="out-in">
                    <router-view :auth="auth" :user="req.user.unwrap()" :roles="['admin']"/>
                </transition>
            </div>

            <div v-else :key="IS_NOT_LOGGED_IN">
                <LoginForm/>
                <Error v-if="req.user.isFailed()">
                    {{ req.user.unwrapError() }}
                </Error>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import LoginForm from "./components/LoginForm.vue";
import Loading from "./components/Loading.vue";
import MenuBar from "./components/MenuBar.vue";
import VueRouter from "vue-router";
import { debug } from "util";
import { M, MsgBus } from "./messages";
import WR from './lib/WebRequest'

// constants - for everything w/in this components scope
enum Cs {
    // Login Consts
    IS_LOGGED_IN,
    IS_NOT_LOGGED_IN,
    IS_LOGGING_IN,
}

export default /*class App extends Vue*/ ({
    components: { LoginForm, Loading, MenuBar },
    data: () => ({
        req: {
            user: WR.NotRequested()
        },
        auth: null,
        ...Cs
    }),
    methods: {
        loginFailed(msg?: string) {
            this.req.user = WR.Failed(`Login failed${msg ? `: ${msg}`: ''}`)
        },
        loadAuth() {
            this.req.user = WR.Loading()

            this.$flux.auth.loadAuth().caseOf({
                nothing: () => this.loginFailed("no authentication"),
                just: auth => {
                    this.auth = auth;
                    this.loadUser();
                }
            });
        },
        loadUser() {
            if (this.user) this.user.loading = true;
            this.req.user = WR.Loading()
            this.loadUserSilent()
        },
        loadUserSilent() {
            this.$flux.v1.getUserDetails(this.auth).then(r => {
                this.req.user = r
                r.do({
                    failed: e => {
                        this.loginFailed();
                        if (e.err && e.err.status == 403) {
                            this.$flux.auth.remove();
                        } else {
                            this.$unknownErr(e);
                        }
                    },
                    success: u => {
                        this.user = u;
                    }
                })
            });
        },
        logout() {
            this.$flux.auth.remove()
            this.req.user = WR.NotRequested()
        }
    },
    created() {
        this.loadAuth();

        MsgBus.$on(M.REFRESH_AUTH, () => {
            this.loadAuth();
        });
        MsgBus.$on(M.REFRESH_USER, (opts = {silent: false}) => {
            if (opts.silent)
                return this.loadUserSilent()
            this.loadUser();
        });
        MsgBus.$on(M.GOT_USER_DETAILS, (user) => {
            this.user = user
            this.req.user = WR.Success(user)
        });

        this.$on(M.LOGOUT, this.logout)
        MsgBus.$on(M.LOGOUT, this.logout)
    }
});
</script>

<style lang="scss">
// app container styling
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    // color: #2c3e50;
    color: #121c25;
}

// transitions - used mostly for routes
.fade-enter-active,
.fade-leave-active {
    transition-property: opacity;
    transition-duration: 0.25s;
}

.fade-enter-active {
    transition-delay: 0.25s;
}

.fade-enter,
.fade-leave-active {
    opacity: 0;
}

// main sitewide styling

@import "tachyons";

// not sure if we'll use this
$btn-pri-color: #e3580d;
$btn-norm-color: #ddd;

.depressed-btn-shadow {
    box-shadow: inset 0 0 0 20rem rgba(0,0,0,.125), inset 0 3px 4px 0 rgba(0,0,0,.25), 0 0 1px rgba(0,0,0,.125);
}

.btn {
    @extend .pa2;
    @extend .ba;
    // @extend .bw1;
    @extend .br2;
    @extend .b--gray;
    background-color: $btn-norm-color;
    transition: box-shadow 0.3s ease-in-out;
}

.btn:active:enabled {
    @extend .depressed-btn-shadow;
}

a.btn {
    @extend .no-underline;
}

button {
    @extend .btn;
}

button:hover {
    @extend .shadow-1;
}

button:disabled:hover {
}


// note - but exists where a <button class="tool-btn"> in another component
// will not inherit some of these. Workaround (as in `Editable.vue`) is to
// declare something like:
// /*
// button {
//     @extend .mv2;
//     @extend .mh1;
//     @extend .f4;
// }
// */
.tool-btn {
    @extend .br2;
    @extend .dib;
    @extend .pv1;
    @extend .ph3;
    @extend .mv2;
    @extend .mh1;
    @extend .shadow-2;
    @extend .bg-light-gray;
    @extend .ph2;
    @extend .f4;
    transition: transform .25s ease-out, -webkit-transform .25s ease-out, box-shadow 0.3s ease-in-out;
    transform: translateZ(0);
}

.tool-btn:hover {
    transform: scale(1.05);
}

.btn-group > .tool-btn {
    @extend .ma0;
    @extend .br0;
    box-shadow: 0px 0px 0px 0px rgba( 0, 0, 0, 0.2 );
}

.btn-group > .tool-btn:first-of-type {
    @extend .br2;
    @extend .br--left;
    box-shadow: -3px 2px 2px 2px rgba( 0, 0, 0, 0.2 );
}
.btn-group > .tool-btn:last-of-type {
    @extend .br2;
    @extend .br--right;
    box-shadow: 3px 2px 2px 2px rgba( 0, 0, 0, 0.2 );
}

.btn-group {
    @extend .mv2;
    @extend .mh2;
    @extend .shadow-2;
    @extend .br2;
    @extend .db;
    white-space: nowrap;
    transition: transform .25s ease-out, -webkit-transform .25s ease-out, box-shadow 0.3s ease-in-out;
    transform: translateZ(0);
}

.tool-btn:not(button) {
    @extend .pointer;
}

button.tool-btn {
    border: none;
}

button.tool-btn:enabled {
    @extend .pointer;
}

button.tool-btn:disabled {
    transition: none;
    transform: none;
    box-shadow: none;
    @extend .ba;
}

button.tool-btn:disabled:hover {
}

.input {
    display: inline-block;
    @extend .pa2;
    @extend .ba;
}

input {
    @extend .input;
}

.inputGroup .input {
    width: inherit;
}

// a glass for alternating the bg colors of children a bit
.child-bg-alt .row:nth-child(even) {
    background-color: #eee;
}
.child-bg-alt .row:nth-child(odd) {
    background-color: #f8f8f8;
}
</style>
