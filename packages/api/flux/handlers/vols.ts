'use strict';
import { fluxHandler } from './_stdWrapper';
import { DB } from './../db';
const handlerUtils = require('./handlerUtils')

import {
    NdaStatus,
    NdaStage,
    GenerateDraftNdaReqRT,
    GenerateDraftNdaRespRT,
    NdaDraftCommit,
    GenerateDraftNdaResp
} from 'flux-lib/types/db/vols'
import { _Auth, UserV1Object } from 'flux-lib/types/db';
import { genNdaDetailsFromUser } from 'flux-lib/pdfs/nda/generatePdf';
import { uriHash } from 'flux-lib/pdfs/index';

import auth from './auth'

import * as R from 'ramda'

const toExport = {} as any

toExport.getStatus = (db: DB, event, context) => {
    return auth(db).user(async (event, context, {user}): Promise<NdaStatus> => {
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
    })(event, context)
}


toExport.submitForReview = (db: DB, event, context) => {
    return auth(db).user(async (event, context, {user}): Promise<NdaStatus> => {
        const {_id} = user;
        const {pdf, sig} = event.body;

        const status = await db.insertFreshNdaPdfAndSig(_id, pdf, sig)
        return {
            stage: status.stage,
            signatureDataUri: sig,
            pdfDataUri: pdf,
        }
    })(event, context)
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


toExport.generateDraft = (db: DB, event, context) => {
    return auth(db).user(async (event, context, {user}): Promise<GenerateDraftNdaResp> => {
        const {_id} = user;
        const {sigPng} = event.body;

        const ndaDeets = genNdaDetailsFromUser(user)
        const { genPdf } = await import("flux-lib/pdfs/nda/generatePdf")
        const { uri } = await genPdf( ndaDeets.fullName, ndaDeets.fullAddr, sigPng )

        const pdfHash = uriHash(uri)
        const sigHash = uriHash(sigPng)

        return {
            pdfHash,
            sigHash,
            pdfData: uri
        }
    })(event, context)
}


// export const generateDraft = (db: DB, event, context) => {
//     return auth(db).user(async (event, context, {user}): Promise<NdaStatus> => {
//         const {_id} = user;
//         const {sig} =

//         const hashOfSig = sha256(strToUint8a(sig))

//         const status = await db.insertFreshNdaPdfAndSig(_id, pdf, sig)
//         return {
//             stage: status.stage,
//             signatureDataUri: sig,
//             pdfDataUri: pdf,
//         }
//     })(event, context)
// }


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = {
    ...module.exports,
    ...R.mapObjIndexed(handlerUtils.wrapHandler, toExport),
}
