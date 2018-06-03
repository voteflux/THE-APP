import _Vue from "vue";

export function FluxUtils(Vue: typeof _Vue, options?: any): void {
    Vue.prototype.$formatAddress = user =>
        [user.addr_street_no + " ", user.addr_street + ", ", user.addr_suburb + ", ", user.addr_postcode].join("");

    Vue.prototype.$formatName = user => [user.fname, user.mnames, user.sname].join(" ");
}
