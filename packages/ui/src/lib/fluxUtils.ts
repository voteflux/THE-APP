import _Vue from "vue";

import FluxLogo from "@c/common/FluxLogo.vue"
import { HasAddr, HasName } from "@/lib/api.d";


export function FluxUtils(Vue: typeof _Vue /*, options?: any*/): void {
    Vue.prototype.$formatAddress = (user: HasAddr) =>
        [user.addr_street_no + " ", user.addr_street + ", ", user.addr_suburb + ", ", user.addr_postcode].join("");

    Vue.prototype.$formatName = (user: HasName) => [user.fname, user.mnames, user.sname].join(" ");

    Vue.component('flux-logo', FluxLogo)
}
