<template>
    <v-app id="app" class="w-100" layout>
        <notifications/>
        <transition name="fade" mode="out-in">
            <h2 v-if="req.user.isLoading()" :key="IS_LOGGING_IN" class="mt4" >
                <Loading :size="26">
                    Logging In...
                </Loading>
            </h2>

            <div v-else-if="req.user.isSuccess()" :key="IS_LOGGED_IN">
                <v-toolbar fixed app>
                    <v-toolbar-side-icon :light="true" @click.stop="navOpen = !navOpen" />
                    <v-toolbar-title>
                        <flux-logo :title="pageTitle" />
                    </v-toolbar-title>
                </v-toolbar>
                <nav-drawer v-model="navOpen" :roles="req.roles" />
                <v-content>
                    <v-container fluid>
                        <transition name="fade" mode="out-in">
                            <router-view :auth="auth" :user="req.user.unwrap()" :userO="this.userO" :roles="req.roles" />
                        </transition>
                    </v-container>
                </v-content>
            </div>

            <div v-else :key="IS_NOT_LOGGED_IN">
                <LoginForm :userReq="req.user" />
            </div>
        </transition>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import LoginForm from "@c/LoginForm.vue";
import {Loading, Error} from "@c/common"
import VueRouter from "vue-router";
import { debug } from "util";
import { M, MsgBus } from "./messages";
import WR from 'flux-lib/WebRequest'
import { UserV1Object, Auth } from "@/lib/api"
import { Routes, pageTitle } from './routes'
import { AppFs } from './store/app'
import { UserObject } from './lib/UserObject'

// constants - for everything w/in this components scope
enum Cs {
    // Login Consts
    IS_LOGGED_IN,
    IS_NOT_LOGGED_IN,
    IS_LOGGING_IN,
}

export default /*class App extends Vue*/ Vue.extend({
    components: { LoginForm, Loading, Error },
    data: () => ({
        req: {
            user: WR.NotRequested(),
            roles: WR.NotRequested(),
        },
        auth: undefined as any & Auth,
        user: {} as any,
        userO: {} as UserObject,
        navOpen: null as null | boolean,
        pageTitle: "",
        ...Cs
    }),
    watch: {
        $route (to, from){
            this.pageTitleUpdate();
        }
    },
    methods: {
        pageTitleUpdate(opts?) {
            this.pageTitle = pageTitle(this.$route, opts)
        },
        getRoles() {
            this.req.roles = WR.Loading();
            this.$flux.v2.getRoles(this.auth).then(r => {
                this.req.roles = r
                r.do({
                    failed: (e, errObj) => {
                        // todo: handle failed roles check
                    },
                    success: ({roles}) => {}
                })
                this.$forceUpdate()
            })
        },
        loginFailed(msg?: string) {
            this.req.user = WR.Failed(`Login failed${msg ? `: ${msg}`: ''}`)
        },
        loadAuth() {
            this.req.user = WR.Loading()

            this.$flux.auth.loadAuth().foldL(
                () => this.loginFailed("Cannot find authentication token. Unable to log in."),
                auth => {
                    this.auth = auth;
                    this.loadUser();
                }
            );
        },
        loadUser() {
            this.req.user = WR.Loading()
            this.loadUserSilent()
            this.getRoles()
        },
        async loadUserSilent() {
            console.log('loadUserSilent 1')
            this.req.user = await this.$flux.v1.getUserDetails(this.auth)
            console.log('loadUserSilent 2')
            this.req.user.do({
                failed: (e, errObj) => {
                    this.loginFailed();
                    console.log("Login error", errObj)
                    if (errObj && errObj.status == 403) {
                        this.$flux.auth.remove();
                    } else {
                        this.$unknownErr(e);
                    }
                },
                success: u => {
                    this.setUser(u)
                }
            })
        },
        logout() {
            this.$flux.auth.remove()
            this.req.user = WR.NotRequested()
        },
        setUser(user) {
            this.user = user
            this.userO = new UserObject(user, this.auth, this.$flux)
            this.req.user = WR.Success(user)
        }
    },
    created() {
        if (this.$route.query.s) {
            const s = this.$route.query.s;
            const toRemoveBase = `s=${s}`;
            console.log("detected secret as hash param, saving and removing");
            this.$flux.auth.saveSecret(s);
            window.location.href = window.location.href.replace(`?${toRemoveBase}`, '?').replace(`&${toRemoveBase}`, '')
            return
        }

        const url = new URL(window.location.href);
        const s = url.searchParams.get('s');
        if (s) {
            console.log("detected secret as get param, saving and removing");
            this.$flux.auth.saveSecret(s);
            url.searchParams.delete('s');
            window.location.href = url.href;
            return;
        }

        if (this.$route.query.stage || localStorage.getItem('stage')) {
            console.log(`setting endpoints to stage: ${this.$route.query.stage || console.log(`setting endpoints to stage: ${this.$route.query.stage }`)}`)
            this.$flux.setEndpoints(this.$route.query.stage || localStorage.getItem('stage') || '');
        }

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
            this.setUser(user)
        });
        MsgBus.$on(M.REFRESH_ROLES, () => {
            this.getRoles();
        })

        this.$on(M.LOGOUT, this.logout)
        MsgBus.$on(M.LOGOUT, this.logout)

        this.$on(M.PAGE_TITLE_UPDATE, this.pageTitleUpdate)
        MsgBus.$on(M.PAGE_TITLE_UPDATE, this.pageTitleUpdate)
        this.pageTitleUpdate()

        this.$store.commit(AppFs.initHistoryCount)
    },

    mounted(){
    },

    beforeRouteEnter(to, from, next) {
        // check for s param
        console.log(to.query)
        if (Object.keys(to.query).length > 0) {
            next(vm => {
                if (to.query.s) {
                    // this.auth.saveSecret(this.query.s)
                    console.log('triggering saveSecret')
                }
            })
        }
    }
});
</script>

<style lang="scss">
@import "tachyons-sass/tachyons.scss";

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


.expand-enter-active {
    transition-delay: 1s;
}
.expand-enter-active,
.expand-leave-active {
  transition-property: opacity, height;
  transition-duration: 0.3s;
}

.expand-enter,
.expand-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease-in-out;
  overflow: hidden;
}

.expand-enter,
.expand-leave-to {
  height: 0;
}


.slide-fade-enter-active {
  transition: all .3s ease;
//   position: absolute;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  position: absolute;
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}





// main sitewide styling


.editable-root {
    min-height: 4.9rem;
}

ul.ul-spaced li {
    margin-top: 10px;
}

/* BUTTONS */

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

.btn-transparent {
    @extend .btn;
    background-color: rgba( 0, 0, 0, 0.0 );
}

.btn:active:enabled {
    @extend .depressed-btn-shadow;
}

// .btn:disabled {
//     @extend .bn
// }

a.btn {
    @extend .no-underline;
}

button {
    // @extend .btn;
}

button .btn-transparent {
    @extend .btn-transparent;
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

button.v-toolbar__side-icon {
    border: 0;
}

// .v-btn button {
//     border: 0;
// }

/* INPUTS */

.input {
    display: inline-block;
    @extend .pa2;
    @extend .ba;
}

input {
    @extend .input;
}

textarea {
    @extend .input;
}

.v-input textarea {
    border: 0;
}

select {
    @extend .input
}

.inputGroup .input {
    width: inherit;
}

.v-input input {
    border: 0;
}

// a glass for alternating the bg colors of children a bit
.child-bg-alt .row:nth-child(even) {
    background-color: #eee;
}
.child-bg-alt .row:nth-child(odd) {
    background-color: #f8f8f8;
}

// spin icons: animation
.fa-spin {
  -webkit-animation: fa-spin 2s infinite linear;
  animation: fa-spin 2s infinite linear;
}
.fa-pulse {
  -webkit-animation: fa-spin 1s infinite steps(8);
  animation: fa-spin 1s infinite steps(8);
}
@-webkit-keyframes fa-spin {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(359deg);
    transform: rotate(359deg);
  }
}
@keyframes fa-spin {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(359deg);
    transform: rotate(359deg);
  }
}
</style>
