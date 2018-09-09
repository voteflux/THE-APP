import { DB } from './../db';
const handlerUtils = require('./handlerUtils')
const R = require('ramda')

const db = {} as DB;  // we will populate this obj later via DB.init(db)

module.exports.genStatsGetinfo = async (event, context) => {
    return {result: await db.update_getinfo_stats()}
}

module.exports.genStatsPublic = async (event, context) => {
    return {result: await db.update_public_stats()}
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
