import { DB } from './../db';
const handlerUtils = require('../handlers/handlerUtils')
import * as R from 'ramda'
import * as revocations from '../stats/revocations'

module.exports.genStatsGetinfo = async (db, event, context) => {
    return {result: await db.update_getinfo_stats()}
}

module.exports.genStatsPublic = async (db, event, context) => {
    return {result: await db.update_public_stats()}
}

module.exports.genS3StatsDaily = async (db, event, context) => {
    return await revocations.dailyStats(db)
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
