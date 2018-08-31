'use strict';

const R = require('ramda')

const db = {};  // we will populate this obj later via DB.init(db)

const utils = require('../utils')
const handlerUtils = require('./handlerUtils')

const auth = require('./auth')(db);

const { Roles } = require('../roles')


module.exports.getRoleAudit = auth.role(Roles.ADMIN, async (event, context, {user}) => {
    const roleAuditRaw = await db.getRoleAudit()
    console.log(`roleAuditRawLen ${roleAuditRaw.length}`, roleAuditRaw)
    // wipe `s` param
    const roleAudit = R.map(role => ({ ...role, users: R.map(utils.cleanUserDoc, role.users) }), roleAuditRaw)
    return roleAudit
});


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
