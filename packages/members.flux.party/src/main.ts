import Vue from "vue";
import App from "./App.vue";
import {} from "./lib/lib";

// eslint-disable-next-line
require("normalize.css");
// eslint-disable-next-line
require("tachyons");

Vue.config.productionTip = true;
Vue.prototype.$dev = Vue.config.productionTip;

import VueResource from "vue-resource";
Vue.use(VueResource);

import Notifications from "vue-notification";
Vue.use(Notifications);

import FluxApi from "./lib/api";
Vue.use(FluxApi);

import ErrHandlers from "./lib/errors";
Vue.use(ErrHandlers);

import { FluxUtils } from "./lib/fluxUtils";
Vue.use(FluxUtils);

import VueRouter from "vue-router";
Vue.use(VueRouter);

import Dashboard from "./components/Dashboard.vue";
import ValidateSelf from "./components/ValidateSelf.vue";

import R from "./routes";

const routes = [
    { path: R.Dashboard, component: Dashboard },
    { path: R.ValidateSelf, component: ValidateSelf },
    { path: "*", redirect: "/" }
];

const router = new VueRouter({ routes });

new Vue({
    router,
    render: h => h(App)
}).$mount("#app");
