import { ER } from 'flux-lib/types/index';
import Vue from "vue";
import {SError} from './errors'
import WebRequest from "flux-lib/WebRequest";
import { Auth } from './api';
import { UserV1Object, SortMethod, Donation, DonationsResp, Paginated, RoleResp, PR, R } from 'flux-lib/types/db'
import { Maybe } from "tsmonad/lib/src";
import { StdV1, GetArbitraryPartial, } from 'flux-lib/types/db/api'
import { UserForFinance } from 'flux-lib/types/db/index';

export interface HasAddr {
    addr_street_no: string;
    addr_street: string;
    addr_suburb: string;
    addr_postcode: string;
}

export interface HasName {
    fname: string;
    sname: string;
    mnames: string;
}


export interface FluxApiMethods {
    v1: {
        getUserDetails: (o: Auth) => PR<UserV1Object>,
        validationWebsocket: () => WebSocket,
        revokeMembership: StdV1<{}>,
        saveUserDetails: (u: Partial<UserV1Object> & Auth) => PR<UserV1Object>,
        sendUserDetails: (opts: {email: string}) => PR<{sent_email: boolean, reason: string}>,
        getSuburbs: (country: string, postcode: string) => PR<{suburbs: string[]}>,
        getStreets: (country: string, postcode: string, suburb: string) => PR<{streets: string[]}>,
    },
    v2: {
        getRoles: (opts : Auth) => PR<{roles: string[]}>,
        getDonations: (opts : GetArbitraryPartial<Donation>) => PR<DonationsResp>,
        addNewDonation: (opts: {doc: Donation} & Auth) => PR<ER<boolean>>,
        donationAutoComplete: (opts: Auth & {email: string}) => PR<ER<UserForFinance>>,
        getRoleAudit: (opts: Auth) => PR<RoleResp[]>,
    },
    utils: {
        onGotUserObj: (r: R<UserV1Object>) => void,
        [method: string]: (...args: any[]) => any
    },
    auth: {
        saveSecret: (s: string) => void,
        loadAuth: () => Maybe<Auth>,
        remove: () => void,
        sendSToAllFluxDomains: (s: string) => void,
        saveApiToken: (token: string) => void
    },
    $dev: boolean
}

declare module "vue/types/vue" {
    interface Vue {
        $formatAddress: (user: HasAddr) => string
        $formatName: (user: HasName) => string
        $err: <T>(msg: string, orig?: T) => SError<T>
        $unknownErr: (msg: any) => SError<any>
        $flux: FluxApiMethods
    }
}
