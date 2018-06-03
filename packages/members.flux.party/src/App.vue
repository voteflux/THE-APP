<template>
    <div id="app" class="w-100 w-80-m w-70-l center">
        <notifications/>

        <MenuBar class=""/>

        <Loading v-show="loginState == IS_LOGGING_IN">
            Checking login details...
        </Loading>

        <div v-show="loginState == IS_LOGGED_IN">
            <transition name="fade"><router-view :auth="auth" :user="user"/></transition>
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
    }
};
</script>

<style>
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
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
</style>
