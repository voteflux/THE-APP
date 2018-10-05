import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
    fname: String,
    mnames: String,
    sname: String,
    s: String,
    addr_postcode: String,
    addr_street_no: String,
    addr_street: String,
    addr_suburb: String,
    addr_country: String,
    detailsValid: Boolean,
    email: Boolean,
    candidature_federal: Boolean,
    volunteer: Boolean,
    contact_number: String,
    ts: Number,
    dobYear: Number,
    dobMonth: Number,
    dobDay: Number,
}
