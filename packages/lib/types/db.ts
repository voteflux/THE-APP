import { ObjectID } from 'bson';
import { CacheDoc } from './db/cache';
export * from './db/stats'
export * from './db/api'
import { SecToken2Doc } from './db/authSecToken2'
import { OneTimeTokenDoc } from './db/oneTimeTokens'
import { Collection } from 'mongodb'
import * as t from 'io-ts'
import { NdaStatus, NdaDraftCommit } from './db/vols';
import { Either } from 'fp-ts/lib/Either'
import { RoleDoc } from './db/roles'


export type _Collection<T> = Collection<T & {_id: ObjectID}>


// when adding a collection add to list of strings below too
export interface DBV1_Collections {
    db_meta: _Collection<any>,
    cache: _Collection<CacheDoc>,
    users: _Collection<UserV1Object>,
    public_stats: _Collection<any>,
    roles: _Collection<RoleDoc>,
    credits: _Collection<any>,
    aec_captcha: _Collection<any>,
    aec_sessions: _Collection<any>,
    app_feedback: _Collection<any>,
    donations: _Collection<any>,
    email_queue: _Collection<any>,
    sms_queue: _Collection<any>,
    generic_queues: _Collection<any>,
    email_validation: _Collection<any>,
    sms_verifications: _Collection<any>,
    errors: _Collection<any>,
    log: _Collection<any>,
    login_codes: _Collection<any>,
    login_tokens: _Collection<any>,
    notify_queue: _Collection<any>,
    party_registration: _Collection<any>,
    paypal_ipn: _Collection<any>,
    pdf_to_user: _Collection<any>,
    pdfs: _Collection<any>,
    poll_options: _Collection<any>,
    rate_limits: _Collection<any>,
    rego_forms_collected: _Collection<any>,
    streets: _Collection<any>,
    suburb: _Collection<any>,
    volNdaDraftCommits: _Collection<NdaDraftCommit>,
    volNdaStatus: _Collection<NdaStatus>,
    secToken2: _Collection<SecToken2Doc>,
    oneTimeTokens: _Collection<OneTimeTokenDoc>,
}

// no easy way to keep the type and this list in sync :/
export const collections = [
    "db_meta",
    "cache",
    "users",
    "public_stats",
    "roles",
    "credits",
    "aec_captcha",
    "aec_sessions",
    "app_feedback",
    "donations",
    "email_queue",
    "sms_queue",
    "generic_queues",
    "email_validation",
    "sms_verifications",
    "errors",
    "log",
    "login_codes",
    "login_tokens",
    "notify_queue",
    "party_registration",
    "paypal_ipn",
    "pdf_to_user",
    "pdfs",
    "poll_options",
    "rate_limits",
    "rego_forms_collected",
    "streets",
    "suburb",
    "volNdaStatus",
    "volNdaDraftCommits",
    "secToken2",
    "oneTimeTokens",
]
// ensure this is up to date with the class model above

export type DBV1 = {
    rawDb: any,
    client: any,
} & DBV1_Collections

export type DBV2 = undefined


export interface UserNameDeets {
    fname: string;
    mnames: string;
    sname: string;
}

export interface UserBasicContactDeets {
    email: string,
    contact_number: string,
}

export interface UserValidationDeets {
    detailsValid: boolean;
    validationReason: string;
}

export interface UserAddressDeets {
    addr_street: string;
    addr_suburb: string;
    addr_postcode: string;
    addr_street_no: string;
    addr_country: string;
}

export interface UserDobDeets {
    dobDay: number
    dobMonth: number
    dobYear: number
    dob: string
}

export interface UserV1Object extends UserDobDeets, UserAddressDeets, UserValidationDeets, UserBasicContactDeets, UserNameDeets {
    timestamp: number;
    s: string
}

export interface UserForFinance extends UserAddressDeets, UserBasicContactDeets, UserNameDeets {}


export enum SortMethod {
    TS,
    ID
}
export const SM = SortMethod


export interface Paginated {pageN: number, limit: number, total: number}

export const DonationRT = t.intersection([
    t.type({
        name: t.string,
        street: t.string,
        city: t.string,
        state: t.string,
        postcode: t.string,
        country: t.string,
        branch: t.string,
        ts: t.number,
        date: t.string,
        amount: t.number,
        unit: t.string,
        email: t.string,
        payment_source: t.string,
        id: t.string,
        extra_data: t.partial({
            comment: t.string,
            aud_value: t.number
        })
    }),
    t.partial({
        _id: t.string,
    })
])
export type Donation = t.TypeOf<typeof DonationRT>

export interface DonationsResp {donations: Donation[], totalDonations: number, pageN: number, limit: number, sortMethod: number}

export interface RoleResp {role: string, users: UserV1Object[]}

export interface RolesResp {roles: string[]}
