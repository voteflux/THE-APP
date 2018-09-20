'use strict';
import { DB } from './../db';
const handlerUtils = require('./handlerUtils')

import { NdaStatus, NdaStage } from 'flux-lib/types/db/vols'

const R = require('ramda')

const utils = require('../utils')


export const getNdaStatus = (db: DB, ...args) => {
    return require('./auth')(db).user(async (event, context, {user}): Promise<NdaStatus> => {
        const {_id} = user;

        const status = await db.getNdaStatus(_id)
        if (status !== null) {
            return {
                stage: status.stage,
                signatureDataUri: status.signatureDataUri,
                pdfDataUri: status.pdfDataUri,
            }
        }

        return {
            stage: NdaStage.NOT_STARTED,
            signatureDataUri: '',
            pdfDataUri: '',
        }
    })(...args)
}


export const submitNdaPdfAndSignature = (db: DB, ...args) => {
    return require('./auth')(db).user(async (event, context, {user}): Promise<NdaStatus> => {
        const {_id} = user;
        const {pdf, sig} = event.body;

        const status = await db.insertFreshNdaPdfAndSig(_id, pdf, sig)
        return {
            stage: status.stage,
            signatureDataUri: sig,
            pdfDataUri: pdf,
        }
    })(...args)
}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler, module.exports);
