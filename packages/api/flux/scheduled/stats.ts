import { DB } from './../db';
const handlerUtils = require('../handlers/handlerUtils')
const R = require('ramda')

module.exports.genStatsGetinfo = async (db, event, context) => {
    return {result: await db.update_getinfo_stats()}
}

module.exports.genStatsPublic = async (db, event, context) => {
    return {result: await db.update_public_stats()}
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
