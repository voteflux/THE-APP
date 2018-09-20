'use strict';
import { DB } from './../db';
const handlerUtils = require('./handlerUtils')

const R = require('ramda')

const utils = require('../utils')


export const getRoles = (db, ...args) => {
    return require('./auth')(db).user(async (event, context, {user}) => {
        const {_id} = user;

        return {
            roles: await db.getUserRoles(_id),
            status: 'okay'
        }
    })(...args)
}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
