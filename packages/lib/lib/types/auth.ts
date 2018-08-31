import * as t from 'io-ts'
import * as R from 'ramda'

export const AuthPartialRT = t.partial({
    s: t.string,
    authToken: t.string,
    authSig: t.string,
})
export type AuthPartial = t.TypeOf<typeof AuthPartialRT>

// valid auth requests can only have 1 auth method
export const ValidAuthRT = t.refinement(AuthPartialRT, authDoc => {
    const _filteredKeys = R.filter(k => ['s', 'authToken', 'authSig'].includes(k), R.keys(authDoc))
    return _filteredKeys.length == 1
})
export type ValidAuth = t.TypeOf<typeof ValidAuthRT>
