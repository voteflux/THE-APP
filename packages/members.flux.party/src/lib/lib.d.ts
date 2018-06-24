import Vue from "vue";
import {SError} from './errors'
import WebRequest from "@/lib/WebRequest";
import { Auth } from './api';
import { Maybe } from "tsmonad/lib/src";

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
        $formatAddress: (user: HasAddr) => string;
        $formatName: (user: HasName) => string;
        $err: <T>(msg: string, orig?: T) => SError<T>;
        $unknownErr: (msg: any) => SError<any>;
        $flux: {
            v1: {
                [method: string]: (...args: any[]) => PromiseLike<WebRequest<string, any>>
            } & {
                validationWebsocket: () => WebSocket
            },
            v2: {
                [method: string]: (...args: any[]) => PromiseLike<WebRequest<string, any>>
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
