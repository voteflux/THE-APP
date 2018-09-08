'use strict';
const handlerUtils = require('./handlerUtils')

import { DB } from '../db'
import { DBV1, ThenArg } from 'flux-lib/types';
import { SortMethod, DonationsResp } from 'flux-lib/types/db'

const R = require('ramda')

const db = {} as DB;  // we will populate this obj later via DB.init(db)

const utils = require('../utils')

const auth = require('./auth')(db);

const { Roles } = require('../roles')


module.exports.getDonations = auth.role(Roles.FINANCE, async (event, context, {user}): Promise<DonationsResp> => {
    const data = event.body;
    const pageN = data.pageN || 0;
    const limit = data.limit || 10;
    const sm = data.sortMethod || SortMethod.TS
    const totalDonations = await db.getDonationsN()
    const toReturn: DonationsResp = {
        donations: await db.getDonations(pageN, limit, sm),
        sortMethod: sm,
        ...utils.genPagination(totalDonations, limit, pageN)
    }
    return toReturn
});


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
