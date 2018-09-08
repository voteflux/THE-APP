export * from './stats'
import { Collection } from 'mongodb'

// when adding a collection add to list of strings below too
export interface DBV1Collections {
    db_meta: Collection<any>,
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
    suburb: Collection<any>
}

// no easy way to keep the type and this list in sync :/
export const collections = [
    "db_meta",
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
]

export type DBV1 = {
    rawDb: any,
    client: any,
} & DBV1Collections

export interface UserV1Object {
    fname: string;
    mnames: string;
    sname: string;
    detailsValid: boolean;
    validationReason: string;
    addr_street: string;
    addr_suburb: string;
    addr_postcode: string | number;
    addr_street_no: string;
    timestamp: number;
}

export enum SortMethod {
    TS,
    ID
}
export const SM = SortMethod


export interface Paginated {pageN: number, limit: number, total: number}

export interface Donation {
    name: string;
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    branch: string;
    ts: number;
    date: string;
    amount: string;
    unit: string;
    email: string;
    payment_source: string;
    id: string;
    extra_data: object | undefined;
}

export interface DonationsResp {donations: Donation[], totalDonations: number, pageN: number, limit: number, sortMethod: number}

export interface RoleResp {role: string, users: UserV1Object[]}
