import Vue from "vue";

interface HasAddr {
    addr_street_no: string;
    addr_street: string;
    addr_suburb: string;
    addr_postcode: string;
}

interface HasName {
    fname: string;
    sname: string;
    mnames: string;
}

declare module "vue/types/vue" {
    interface Vue {
        $formatAddress: (HasAddr) => string;
        $formatName: (HasName) => string;
    }
}
