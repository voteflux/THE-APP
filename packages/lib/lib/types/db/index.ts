export * from './stats'

type Collection<T> = {
    find: (...args: any[]) => Promise<T[]>,
}

export type DBV1 = {
    rawDb: any,
    client: any,
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
    suburb: Collection<any>,
}
