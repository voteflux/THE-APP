'use strict';
import { DB } from './../db';
import auth from './auth'
const handlerUtils = require('./handlerUtils')

import * as R from 'ramda'

const utils = require('../utils')


module.exports.getRoles = (db, event, context) => {
    return auth(db).user(async (event, context, {user}) => {
        const {_id} = user;

        return {
            roles: await db.getUserRoles(_id),
            status: 'okay'
        }
    })(event, context)
}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
