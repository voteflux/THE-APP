import { DB } from './../db';
const handlerUtils = require('../handlers/handlerUtils')
import * as R from 'ramda'

const S3 = require('aws-sdk/clients/s3')

module.exports.genStatsGetinfo = async (db, event, context) => {
    return {result: await db.update_getinfo_stats()}
}

module.exports.genStatsPublic = async (db, event, context) => {
    return {result: await db.update_public_stats()}
}

module.exports.genS3StatsDaily = async (db, event, context) => {
    const s3 = new S3()
    const d = new Date()
    const ts = d.getTime() / 1000 | 0
    const dStr = d.toISOString().slice(0,10)

    const nRevocations = await db.count_logs({action: "deleted_user"})
    const nRevParams = {
        Body: JSON.stringify({ nRevocations, ts }),
        Bucket: "flux-stats"
    }

    const genUploads = (params, name) => ([
        s3.putObject({ ...params, Key: `${dStr}/${name}` }).promise()
        s3.putObject({ ...params, Key: `latest/${name}` }).promise()
    ])

    uploads = [
        ...genUploads(nRevParams, 'revocations')
    ]

    await Promise.all(uploads)

    return {
        ...nRevParams
    }
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
