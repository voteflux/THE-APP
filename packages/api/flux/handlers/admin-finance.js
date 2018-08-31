'use strict';

const R = require('ramda')

const db = {};  // we will populate this obj later via DB.init(db)

const utils = require('../utils')
const handlerUtils = require('./handlerUtils')

const auth = require('./auth')(db);

const { Roles } = require('../roles')


module.exports.getDonations = auth.role(Roles.FINANCE, async (event, context, {user}) => {
    const data = event.body;
    const pageN = data.pageN || 0;
    const limit = data.limit || 10;
    const totalDonations = await db.getDonationsN()
    return {
        donations: await db.getDonations(pageN, limit),
        status: 'okay',
        ...utils.genPagination(totalDonations, limit, pageN)
    }
});


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
