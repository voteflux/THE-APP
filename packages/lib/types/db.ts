import { CacheDoc } from './db/cache';
export * from './db/stats'
export * from './db/api'
import { SecToken2Doc } from './db/authSecToken2'
import { Collection } from 'mongodb'
import * as t from 'io-ts'
import { NdaStatus, NdaDraftCommit } from './db/vols';
import { Either } from 'fp-ts/lib/Either'


// when adding a collection add to list of strings below too
export interface DBV1Collections {
    db_meta: Collection<any>,
    cache: Collection<CacheDoc>,
    users: Collection<any>,
    public_stats: Collection<any>,
    roles: Collection<any>,
    credits: Collection<any>,
    aec_captcha: Collection<any>,
    aec_sessions: Collection<any>,
    app_feedback: Collection<any>,
    donations: Collection<any>,
    email_queue: Collection<any>,
    sms_queue: Collection<any>,
    generic_queues: Collection<any>,
    email_validation: Collection<any>,
    sms_verifications: Collection<any>,
    errors: Collection<any>,
    log: Collection<any>,
    login_codes: Collection<any>,
    login_tokens: Collection<any>,
    notify_queue: Collection<any>,
    party_registration: Collection<any>,
    paypal_ipn: Collection<any>,
    pdf_to_user: Collection<any>,
    pdfs: Collection<any>,
    poll_options: Collection<any>,
    rate_limits: Collection<any>,
    rego_forms_collected: Collection<any>,
    streets: Collection<any>,
    suburb: Collection<any>,
    volNdaDraftCommits: Collection<NdaDraftCommit>,
    volNdaStatus: Collection<NdaStatus>,
    secToken2: Collection<SecToken2Doc>,
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
]
// ensure this is up to date with the class model above

export type DBV1 = {
    rawDb: any,
    client: any,
} & DBV1Collections

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
