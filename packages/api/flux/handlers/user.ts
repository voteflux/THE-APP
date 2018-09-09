import { DB } from './../db';
'use strict';
const handlerUtils = require('./handlerUtils')

const R = require('ramda')

const db = {} as DB;  // we will populate this obj later via DB.init(db)

const utils = require('../utils')

const auth = require('./auth')(db);

export const getRoles = auth.user(async (event, context, {user}) => {
    const {_id} = user;

    return {
        roles: await db.getUserRoles(_id),
        status: 'okay'
    }
})


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
