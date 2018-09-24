'use strict';
import { fluxHandler } from './_stdWrapper';
import { Maybe } from 'tsmonad';
import { DB } from './../db';
const handlerUtils = require('./handlerUtils')
import path from 'path'
import * as t from 'io-ts'
import sha256 from 'fast-sha256';

import { NdaStatus, NdaStage, GenerateDraftNdaReqRT, GenerateDraftNdaRespRT, NdaDraftCommit } from 'flux-lib/types/db/vols'
import { strToUint8a, uint8aToBase64 } from 'flux-lib/utils/index';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import { _Auth } from 'flux-lib/types';
import { UserV1Object } from 'flux-lib/types/db';
import { genPdf, genNdaDetailsFromUser } from 'flux-lib/pdfs/nda/generatePdf';
import { uriHash } from 'flux-lib/pdfs/index';

const R = require('ramda')

const utils = require('../utils')

const toExport = {} as any

toExport.getStatus = (db: DB, ...args) => {
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


toExport.submitForReview = (db: DB, ...args) => {
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



////


/*

// wrap handlers to know about errors, do logging, etc.
const wrapHandler = (f, fName, obj) => async (event, context) => {
    console.log(`Wrapping ${fName} now.`);

    let resp,
        didError = false,
        err;
    let db = { close: () => {} };
    try {
        db = await dbInit(); // this populates the global `db` object
        // f is presumed to be async
        resp = await beforeEnter(f)(db, event, context);
    } catch (_err) {
        err = _err;
        didError = true;
        if (err.message.indexOf("Cannot destructure property") >= 0) {
            const field = err.message.split("`")[1];
            if (field) {
                err = `Field '${field}' is required.`;
            } else if (process.env.STAGE !== "dev") {
                console.error(_err);
                err = "An unknown error occurred. It has been logged.";
            }
        }
        console.error(`Function ${fName} errored: ${err}`);
    } finally {
        await db.close();
    }

    console.log(`Got Response from: ${fName} \n- err: ${err}, \n- resp: ${j(resp || {}).slice(0, 256)}`);

    if (didError) {
        console.log(`Throwing... Error:\n${err}`);
        throw err;
    }
    if (resp && resp.statusCode === undefined) {
        return beforeSend(_r(resp));
    } else {
        return beforeSend(resp);
    }
};

*/



export const generateDraft = async (event, ctx) =>
    (await fluxHandler(
        { auth: _Auth.User(), inType: GenerateDraftNdaReqRT, outType: GenerateDraftNdaRespRT, logParams: false },
        async function generateDraftInner(db: DB, {reqUser, reqBody}, event, context) {

            const ndaDeets = genNdaDetailsFromUser(reqUser)
            const {uri} = await genPdf( ndaDeets.fullName, ndaDeets.fullAddr, reqBody.sigPng )

            const pdfHash = uriHash(uri)
            const sigHash = uriHash(reqBody.sigPng)

            return {
                pdfHash,
                sigHash,
                pdfData: uri
            }
        }
    ))(event, ctx)


// export const generateDraft = (db: DB, ...args) => {
//     return require('./auth')(db).user(async (event, context, {user}): Promise<NdaStatus> => {
//         const {_id} = user;
//         const {sig} =

//         const hashOfSig = sha256(strToUint8a(sig))

//         const status = await db.insertFreshNdaPdfAndSig(_id, pdf, sig)
//         return {
//             stage: status.stage,
//             signatureDataUri: sig,
//             pdfDataUri: pdf,
//         }
//     })(...args)
// }


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = {
    ...module.exports,
    ...R.mapObjIndexed(handlerUtils.wrapHandler, toExport),
}
