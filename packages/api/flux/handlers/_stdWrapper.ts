import * as t from 'io-ts'

import { DB, init as dbInit } from './../db';
import { DBV1, _Auth } from 'flux-lib/types';
import { UserV1Object } from 'flux-lib/types/db';

import * as utils from '../utils'


const getJwt = (headers) => {
    return headers.Authorization
}



export type FluxHandlerV2<I,O> = (db: DB, r: {reqUser: UserV1Object, reqBody: I}, event: any, context: any) => Promise<O>


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
    body: [msg, JSON.stringify(err)].join(' ')
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


const logSuccess = (r: ResponseType): ResponseType => {
    console.log(`Success!!`, JSON.stringify(r, null, 2))
    return r
}

const logFailure = (r: ResponseType): ResponseType => {
    console.error(`Failed!!`, r)
    return r
}



// const beforeEnter = f => (db, event, context) => {
//     if (R.is(String, event.body)) {
//         try {
//             event.body = JSON.parse(event.body);
//         } catch (e) {}
//     }
//     return f(db, event, context);
// };


export const fluxHandler = async <I,O,Aux>(opts: {
        auth: _Auth,
        inType: t.Type<I>,
        outType: t.Type<O>,
        logParams?: boolean,
    }, f: FluxHandlerV2<I,O> ): Promise<(event: any, context: any) => Promise<ResponseType>> => {
        console.log(`Wrapping: ${f.prototype}`)
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
                console.log('called handler; decoding to:', opts.inType)
                const bodyJson = JSON.parse(event.body)
                const reqBody = opts.inType.decode(bodyJson)
                    .getOrElseL(vErr => { let eMsg = JSON.stringify(vErr, null, 2); throw Error(`Unable to decode incoming request of type ${opts.inType.name}. \n\n Error snippets: \n\n${eMsg.slice(0,500)}\n\n${eMsg.slice(eMsg.length - 500, eMsg.length)}`) })

                console.log('req body got')
                // const jwt = getJwt(event.headers)
                // console.log(jwt, event.headers)

                const out =
                    await f(db, {reqUser: {} as UserV1Object, reqBody}, event, context)
                        .then(out => opts.outType.decode(out).getOrElseL(vErr => { throw vErr }))
                        .then(r200)
                        .then(logSuccess)
                        .catch(i => logFailure(r500(i, "Failed decoding return type.")))
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
            return beforeSend(r500(_err as any))
        } finally {
            await db.close();
        }
    }
