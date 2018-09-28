import { FluxHandlerV2, fluxHandler } from './_stdWrapper';
import { _Auth } from 'flux-lib/types/db'


const LoginTokenReq = t.type({
    email: t.string,
})






export const requestLoginToken = async (event, context) =>
    fluxHandler({
        auth: _Auth.None(),
        inType:
    }, async (db, {reqUser, reqBody, reqAuth}, event, context) => {

    })
