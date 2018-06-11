<template>
    <div id="app" class="w-100 w-90-m w-80-l center mb4">
        <notifications/>

        <MenuBar class=""/>

        <Loading v-show="loginState == IS_LOGGING_IN">
            Checking login details...
        </Loading>

        <div v-show="loginState == IS_LOGGED_IN">
            <transition name="fade"><router-view v-if="user" :auth="auth" :user="user" :roles="['admin']"/></transition>
        </div>

        <div v-show="loginState == IS_NOT_LOGGED_IN">
            <LoginForm/>
        </div>
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

// constants - for everything w/in this components scope
enum Cs {
    // Login Consts
    IS_LOGGED_IN,
    IS_NOT_LOGGED_IN,
    IS_LOGGING_IN,
}

export default /*class App extends Vue*/ {
    components: { LoginForm, Loading, MenuBar },
    data: () => ({
        auth: null,
        user: null,
        loginState: Cs.IS_LOGGING_IN,
        ...Cs
    }),
    methods: {
        loginFailed() {
            this.loginState = Cs.IS_NOT_LOGGED_IN;
        },
        loadAuth() {
            this.$flux.auth.loadAuth().caseOf({
                nothing: () => this.loginFailed(),
                just: auth => {
                    this.auth = auth;
                    this.loadUser();
                }
            });
        },
        loadUser() {
            if (this.user) this.user.loading = true;
            this.$flux.v1.getUserDetails(this.auth).then(r =>
                r.caseOf({
                    left: e => {
                        this.loginFailed();
                        if (e.err && e.err.status == 403) {
                            this.$flux.auth.remove();
                        } else {
                            this.$unknownErr(e);
                        }
                    },
                    right: user => {
                        this.loginState = Cs.IS_LOGGED_IN;
                        this.user = user;
                    }
                })
            );
        }
    },
    created() {
        this.loadAuth();

        MsgBus.$on(M.REFRESH_USER, () => {
            this.loadUser();
        });
        MsgBus.$on(M.GOT_USER_DETAILS, (user) => {
            this.user = user;
        });
    }
};
</script>

<style lang="scss">
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    // color: #2c3e50;
    color: #121c25;
}
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

@import "tachyons";

.btn {
    // @extend .dn;
    @extend .pa2;
    @extend .ba;
    @extend .br2;
    @extend .no-underline;
    // @extend .rounded;
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
    @extend .shadow-1;
    @extend .bg-light-gray;
    @extend .ph2;
    @extend .f4;
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
    @extend .shadow-1;
    @extend .br2;
    @extend .db;
    white-space: nowrap;
}

.tool-btn:not(button) {
    @extend .grow;
    @extend .pointer;
}

button.tool-btn {
    border: none;
}

button.tool-btn:enabled {
    @extend .grow;
    @extend .pointer;
}

button.tool-btn:disabled {

}

.input {
    display: inline-block;
    width: 100%;
    height: 100%;
    @extend .pa1;
    @extend .ba;
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
