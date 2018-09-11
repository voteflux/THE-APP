import Vue from "vue";
import App from "./App.vue";

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCoffee, faArrowLeft, faArrowCircleLeft, faPlusSquare, faMinusSquare, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCoffee, faArrowCircleLeft, faPlusSquare, faMinusSquare, faTimes, faSpinner)
Vue.component('fa-icon', FontAwesomeIcon)

// // eslint-disable-next-line
// require("normalize.css");
// // eslint-disable-next-line
// require("tachyons");

// Vue.config.productionTip = true;

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

import ToggleButton from 'vue-js-toggle-button'
Vue.use(ToggleButton)

import Dashboard from "@c/Dashboard.vue";
import UserValidation from "@c/UserValidation.vue";
import UserDetailsMain from "@c/UserDetails";
import UserRevocation from "@c/UserRevocation.vue";
import FinanceUtils from "@c/FinanceUtils.vue";
import AuditRoles from "@c/Admin/AuditRoles.vue";
import FinanceEnterDonation from "@c/Admin/FinanceEnterDonation.vue";

import R from "./routes";

const routes = [
    { path: R.Dashboard, component: Dashboard },
    { path: R.ValidateSelf, component: UserValidation },
    { path: R.EditUserDetails, component: UserDetailsMain },
    { path: R.MembershipRevocation, component: UserRevocation },
    { path: R.FinanceUtils, component: FinanceUtils },
    { path: R.AdminAuditRoles, component: AuditRoles },
    { path: R.AdminFinanceDonationEntry, component: FinanceEnterDonation },
    { path: "*", redirect: "/" }
];

const router = new VueRouter({ routes });

new Vue({
    router,
    render: h => h(App)
}).$mount("#app");
