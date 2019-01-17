import { StdSimpleEitherResp } from 'flux-lib/types/index';
import Vue from "vue";
import {SError} from './errors'
import WebRequest from "flux-lib/WebRequest";
import { Auth } from './api';
import { UserV1Object, SortMethod, Donation, DonationsResp, Paginated, RoleResp, PR, R, RolesResp, AuthJWT } from 'flux-lib/types/db'
import { NdaStatus, NdaDraftCommit, GenerateDraftNdaReq } from 'flux-lib/types/db/vols';
import { StdV1, GetArbitraryPartial, } from 'flux-lib/types/db/api'
import { UserForFinance } from 'flux-lib/types/db';
import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'
import {QandaQuestion} from "flux-lib/types/db/qanda";

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
        getRoles: (opts : Auth) => PR<RolesResp>,
        getDonations: (opts : GetArbitraryPartial<Donation>) => PR<DonationsResp>,
        addNewDonation: (opts: {doc: Donation} & Auth) => PR<StdSimpleEitherResp<boolean>>,
        donationAutoComplete: (opts: Auth & {email: string}) => PR<StdSimpleEitherResp<UserForFinance>>,
        getRoleAudit: (opts: Auth) => PR<RoleResp[]>,
        getNdaStatus: (opts: Auth) => PR<NdaStatus>,
        submitNdaPdfAndSignature: (args: Auth & {pdf: string, sig: string}) => PR<NdaStatus>,
        ndaGenerateDraftPdf: (auth: AuthJWT, args: GenerateDraftNdaReq) => PR<NdaDraftCommit>,
    },
    v3: {
        qanda: {
            getMine: (o: Auth) => PR<{questions: QandaQuestion}>,
            getAll: () => PR<{questions: QandaQuestion}>,
            submit: (o: Auth) => PR<{submitted: string, qid: string}>,
        }
    },
    utils: {
        // onGotUserObj: (r: R<UserV1Object>) => void,
        [method: string]: (...args: any[]) => any
    },
    auth: {
        saveSecret: (s: string) => void,
        loadAuth: () => Option<Auth>,
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
