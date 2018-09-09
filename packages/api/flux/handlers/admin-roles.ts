'use strict';
const handlerUtils = require('./handlerUtils')
const R = require('ramda')
const utils = require('../utils')
const { Roles } = require('../roles')


module.exports.getRoleAudit = async (db, ...args) => {
    return require('./auth')(db).role(Roles.ADMIN, async (event, context, {user}) => {
        console.log(db)
        const roleAuditRaw = await db.getRoleAudit()
        console.log(`roleAuditRawLen ${roleAuditRaw.length}`, roleAuditRaw)
        // wipe `s` param
        const roleAudit = R.map(role => ({ ...role, users: R.map(utils.cleanUserDoc, role.users) }), roleAuditRaw)
        return roleAudit
    })(...args)
}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
