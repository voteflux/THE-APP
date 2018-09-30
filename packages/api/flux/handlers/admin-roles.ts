'use strict';
const handlerUtils = require('./handlerUtils')
import * as R from 'ramda'
const utils = require('../utils')
const { Roles } = require('../roles')

import auth from './auth'


module.exports.getRoleAudit = async (db, event, context) => {
    return auth(db).role(Roles.ADMIN, async (event, context, {user}) => {
        console.log(db)
        const roleAuditRaw = await db.getRoleAudit()
        console.log(`roleAuditRawLen ${roleAuditRaw.length}`, roleAuditRaw)
        // wipe `s` param
        const roleAudit = R.map(role => ({ ...role, users: R.map(utils.cleanUserDoc, role.users) }), roleAuditRaw)
        return roleAudit
    })(event, context)
}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
