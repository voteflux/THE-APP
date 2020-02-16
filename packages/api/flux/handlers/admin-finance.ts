'use strict';
const handlerUtils = require('./handlerUtils')

import { DB, Qs, DBMethods } from '../db';
import { DBV1 } from 'flux-lib/types/db';
import { SortMethod, DonationsResp } from 'flux-lib/types/db'
import { GetArbitraryPartial } from 'flux-lib/types/db';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'
import { DonationRT, Donation } from 'flux-lib/types/db';
import { StdSimpleEitherResp } from 'flux-lib/types';
import { filterProps } from 'flux-lib/utils'
import { randomBytes } from 'crypto';
import { UserForFinance } from 'flux-lib/types/db';

import auth from './auth'

import * as R from 'ramda'
import { Response } from '../types';
import JSZip = require('jszip');

const utils = require('../utils')

const { Roles } = require('../roles')

module.exports.getDonations = (db, event, context) => {
    return auth(db).role(Roles.FINANCE, async (event, context, {user}): Promise<DonationsResp> => {
        const data = event.body as GetArbitraryPartial<Donation>;
        const pageN = data.pageN || 0;
        const limit = data.limit || 100;
        const sm = data.sortMethod || SortMethod.TS
        const query = data.query || {}
        const totalDonations = await db.getDonationsN()
        const toReturn: DonationsResp = {
            donations: await db.getDonations(pageN, limit, sm, query),
            sortMethod: sm,
            ...utils.genPagination(totalDonations, limit, pageN)
        }
        return toReturn
    })(event, context)
}


module.exports.getDonationArchive = (db, event, context) => {
    return auth(db).role(Roles.FINANCE, async (e, c, {user}): Promise<Response> => {
        const allDonations: Donation[] = await db.getDonations(0, 1 + (await db.getDonationsN()), SortMethod.TS)
        const keys = R.pipe(
            R.map(R.keys),
            R.reduce((acc, elem) => R.uniq(R.concat(acc, elem)), [] as string[]),
            R.sortBy(a => a)
        )(allDonations)
        const header = R.join(',', R.map(JSON.stringify, keys))
        const rows = R.map(R.pipe(
            (d: Donation) => R.map(k => d[k] ? JSON.stringify(d[k]) : '', keys),
            R.join(',')
        ))(allDonations)
        const rawCsv = R.join('/r/n', R.concat([header], rows))
        const zip = new JSZip()
        zip.file("donations.csv", rawCsv)
        const zipFile = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })  // todo: can we specify base64 here
        return {
            statusCode: 200,
            body: bufferToBase64(zipFile),
            headers: {
                'Application-Type': 'application/zip'
            }
        }
    })(event, context)
}


module.exports.addNewDonation = (db, event, context) => {
    return auth(db).role(Roles.FINANCE, async (event, context, {user}): Promise<StdSimpleEitherResp<boolean>> => {
        const {doc} = event.body
        doc.id = randomBytes(6).toString('hex')
        ThrowReporter.report(DonationRT.decode(doc))
        await db.addToQueue(Qs.Q_RECEIPTS, doc)
        return { right: true }
    })(event, context)
}


module.exports.donationAutoComplete = (db: DBMethods, event, context) => {
    return auth(db).role(Roles.FINANCE, async (event, context, {user}): Promise<StdSimpleEitherResp<UserForFinance>> => {
        const {email} = event.body

        const fullDonorUser = await db.getUserFromEmail(email)
        if (fullDonorUser === null) {
            return { left: "No user with that email address." }
        }
        const donor: UserForFinance = filterProps(
            (k) => [
                "fname", 'mnames', 'sname', 'email', 'contact_number', 'addr_street',
                'addr_postcode', 'addr_suburb', 'addr_street_no', 'addr_country'
            ].includes(k),
            fullDonorUser
        )

        return { right: donor }
    })(event, context)
}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
