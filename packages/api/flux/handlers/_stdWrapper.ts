import { left, right, Either } from 'fp-ts/lib/Either';
import * as t from 'io-ts'

import { DB, init as dbInit } from './../db';
import { DBV1, _Auth, UserV1Object } from 'flux-lib/types/db';

import * as utils from '../utils'
import { Payload, SignedReqNoValidation, isSignedReqValid } from 'flux-lib/types/db/auth'
import { SignedReqNoValidationRT, validationIssues, CompleteSignedReq } from '../../../lib/types/db/auth'
import { EitherPromi } from 'flux-lib/monads'


const getJwt = (headers): Either<string, string> => {
    return right(headers.Authorization) || left("No JWT Authorization headers present.")
}


type AuthData = {
    publicKey: string,
    sessionId: string,
    ecSig: string,
    payload: Payload
}


export type FluxHandlerV2<I,O> = (
    db: DB,
    r: {reqAuth: AuthData, reqUser: UserV1Object, reqBody: I},
    event: any,
    context: any
) => Promise<O>


type ResponseType = {
    statusCode: number
    body: string
    headers?: { [h: string]: string }
}

const r200 = <T extends Object>(body: T): ResponseType => ({
    statusCode: 200,
    body: JSON.stringify(body)
});

const r500 = (err: Error, msg = ""): ResponseType => ({
    statusCode: 500,
    body: [msg, err].join(' ')
});

const beforeSend = (response: ResponseType): ResponseType => {
    response.headers = utils.R.merge(
        {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        },
        response.headers || {}
    );
    return response;
};


const logAndPass = <R>(r: R): R => {
    console.log(r)
    return r
}


const logSuccess = (r: ResponseType): ResponseType => {
    console.log(`Success!!`, JSON.stringify(r, null, 2))
    return r
}

const logFailure = (r: ResponseType): ResponseType => {
    console.error(`Failed!!`, r)
    return r
}

const logTraceBack = <R>(e: Error, toRet: R): R => {
    console.trace(e)
    return toRet
}


const decodeError = (opts) => (vErr) => {
    let eMsg = JSON.stringify(vErr, null, 2);
    return `Unable to decode incoming request of type ${opts.inType.name}.
        Error snippets:

        first 500 chars of error message: ${eMsg.slice(0,500)}

        last 500 chars of error message: ${eMsg.slice(eMsg.length - 500, eMsg.length)}
    `
}


export const fluxHandler = async <I,O,Aux>(opts: {
        auth: _Auth,
        inType: t.Type<I>,
        outType: t.Type<O>,
        logParams?: boolean,
    }, f: FluxHandlerV2<I,O> ): Promise<(event: any, context: any) => Promise<ResponseType>> => {
        // console.log(`Wrapping: ${f.prototype}`)
        const _logParams = opts.logParams !== false

        console.log('init db')

        const db = await dbInit();

        console.log('init db - DONE')
        try {
             // this populates the global `db` object
            // f is presumed to be async
            // resp = await beforeEnter(f)(db, event, context);

            console.log('declaring handler')
            const _handler = async (event, context): Promise<ResponseType> => {
                console.log('called handler; decoding to:', opts.inType.name)

                // just check we can decode first
                // const rawBodyE = SignedReqNoValidationRT.decode(JSON.parse(event.body))
                // // set up main EitherPromi chain
                // const a = new EitherPromi((res, rej) => res(rawBodyE))
                //             .mapLeft(decodeError(opts))
                //             .chain((rawBody: CompleteSignedReq) => // this is a SignedReq<string>
                //                 validationIssues(rawBody).mapLeft(decodeError(opts)).map(() => ({ rawBody })))
                //             .chain((scope) =>
                //                 // check if JWT is present
                //                 getJwt(event.headers).map(authHdr => ({ ...scope, authHdr })))
                //             .asyncChain(async (scope) => {
                //                 const authRecord = await db.getUidFromS(scope.rawBody)
                //                 return right("blah")
                //             })
                // const bodyAuthE = rawBodyE.mapLeft(decodeError(opts))
                //     .chain((rawBody: CompleteSignedReq) => // this is a SignedReq<string>
                //         validationIssues(rawBody).mapLeft(decodeError(opts)).map(() => ({ rawBody }))
                //         // signature is valid
                //     ).chain((scope) =>
                //         // check if JWT is present
                //         getJwt(event.headers).map(authHdr => ({ ...scope, authHdr }))
                //     )



                // do auth stuff... eventually
                const reqBody = JSON.parse(event.body)
                console.log('req body got', reqBody)



                // const jwt = getJwt(event.headers)
                // console.log(jwt, event.headers)
                if (!opts.auth.isNone()) {

                }

                console.log("starting function...")

                const out =
                    await f(db, {reqUser: {} as UserV1Object, reqBody, reqAuth: {} as AuthData}, event, context)
                        .then(logAndPass)
                        .then(out => opts.outType.decode(out).getOrElseL(vErr => { throw `Failed to decode ${out} into ${opts.outType.name}` }))
                        .then(r200)
                        .then(logSuccess)
                        .catch(i => logTraceBack(i, logFailure(r500(i, "Failed decoding return type."))))
                        .then(beforeSend)

                return out
            }

            console.log('returning handler')
            return _handler


        } catch (_err) {
            // err = _err;
            // didError = true;
            // if (err.message.indexOf("Cannot destructure property") >= 0) {
            //     const field = err.message.split("`")[1];
            //     if (field) {
            //         err = `Field '${field}' is required.`;
            //     } else if (process.env.STAGE !== "dev") {
            //         console.error(_err);
            //         err = "An unknown error occurred. It has been logged.";
            //     }
            // }
            // console.error(`Function ${fName} errored: ${err}`);
            return async () => beforeSend(r500(_err as any))
        } finally {
            await db.close();
        }
    }
