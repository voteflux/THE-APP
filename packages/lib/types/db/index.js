"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// no easy way to keep the type and this list in sync :/
exports.collections = [
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
];
var SortMethod;
(function (SortMethod) {
    SortMethod[SortMethod["TS"] = 0] = "TS";
    SortMethod[SortMethod["ID"] = 1] = "ID";
})(SortMethod = exports.SortMethod || (exports.SortMethod = {}));
exports.SM = SortMethod;
