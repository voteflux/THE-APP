import { UserV1Object } from 'flux-lib/types/db';
import Vue from "vue";
import {SError} from './errors'
import WebRequest from "@/lib/WebRequest";
import { Auth } from './api';
import { Donation, DonationsResp, Paginated, RoleResp } from 'flux-lib/types/db'
import { Maybe } from "tsmonad/lib/src";

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

type PR<r> = PromiseLike<WebRequest<string, r>>

type StdV1<r> = (opts: Auth) => PR<r>

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
        getDonations: (opts : Auth | Paginated) => PR<DonationsResp>,
        getRoleAudit: (opts: Auth) => PR<RoleResp[]>,
    },
    utils: {
        [method: string]: (...args: any[]) => any
    },
    auth: {
        saveSecret: (s: string) => void,
        loadAuth: () => Maybe<Auth>,
        remove: () => void,
        sendSToAllFluxDomains: (s: string) => void,
        saveApiToken: (token: string) => void
    }
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
