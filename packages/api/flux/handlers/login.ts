import { FluxHandlerV2, fluxHandler } from './_stdWrapper';
import { _Auth } from 'flux-lib/types/db'
import * as t from 'io-ts'
import { SimpleEitherRT } from 'flux-lib/types'; // eitherToSimpleEither
import { fromNullable, Either, left, right } from 'fp-ts/lib/Either'
import { TaskEither, fromEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { TokenNamespaces } from 'flux-lib/types/db/oneTimeTokens';
import { UserV1Object } from '../../../lib/types/db'
import { CloudWatchLogs } from 'aws-sdk';


const LoginTokenReq = t.type({
    email: t.string,
})

const LoginTokenResp = SimpleEitherRT(t.string, t.null)


const asyncChain = async <L,R,R2>(e: Either<L, R>, f: (R) => Promise<Either<L,R2>>): Promise<Either<L,R2>> => {
    if (e.isRight())
        return await f(e.value)
    return left(e.value)
}


const sendLoginTokenEmail = async (user: UserV1Object, {token}) => {
    return left(`Failed to send email`)
    return right({})
}


const logReqLoginTokenFailures = (tokenE, emailE) => {
    if (tokenE.isLeft())
        console.error(`Error creating login token request:\nTokenE: ${tokenE.value}`)
    if (emailE.isLeft())
        console.error(`Error creating login token request:\nEmailE: ${emailE.value}`)
}


const eToTuple = <L, R1, R2>(e1: Either<L, R1>, e2: Either<L, R2>): Either<L, [R1, R2]> =>
    e1.chain(r1 => e2.map(r2 => [r1, r2] as [R1, R2]))


export const requestLoginToken = async (event, context) =>
    (await fluxHandler({
        auth: _Auth.None(),
        inType: LoginTokenReq,
        outType: LoginTokenResp,
        logParams: true
    }, async (db, {reqBody, reqAuth}, event, context) => {
        const userE = await db.getUserFromEmail(reqBody.email).then(fromNullable('Unknown email'))
        const tokenE = await asyncChain(userE, user => db.oneTimeTokens.addNewOneTimeToken(user._id, TokenNamespaces.LOGIN_REQ))
        const emailE = await asyncChain(eToTuple(userE, tokenE), ([user, {token}]) => sendLoginTokenEmail(user, token))
        logReqLoginTokenFailures(tokenE, emailE)
        return {right: null}
    }))(event, context)
