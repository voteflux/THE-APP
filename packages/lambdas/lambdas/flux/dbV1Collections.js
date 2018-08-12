// exports a list of collections in db-v1 so that we can make
// our db object a bit nicer (i.e. by setting db.users = client.collection('users'))

module.exports = [
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
    "suburbs"
]
