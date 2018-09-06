import Vue from "vue";
import {SError} from './errors'
import WebRequest from "@/lib/WebRequest";
import { Auth, Donation, DonationsResp, Paginated, RoleResp } from './api';
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

declare module "vue/types/vue" {
    interface Vue {
        $formatAddress: (user: HasAddr) => string;
        $formatName: (user: HasName) => string;
        $err: <T>(msg: string, orig?: T) => SError<T>;
        $unknownErr: (msg: any) => SError<any>;
        $flux: {
            v1: {
                [method: string]: (...args: any[]) => PR<any>
            } & {
                validationWebsocket: () => WebSocket
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
            }
        }
    }
}
