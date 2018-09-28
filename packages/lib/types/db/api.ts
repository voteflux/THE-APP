import { FilterQuery } from 'mongodb';
import { SortMethod, Paginated } from '../db';
import WebRequest from '../../WebRequest';
import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option';

export interface Auth {
  apiToken?: string;
  s: string | undefined;
}

export type KeyPair = {
    sk: Uint8Array,
    pk: Uint8Array
}

export type JWT = { jwt: string }

export type AuthJWT = JWT & KeyPair


export type Req<r> = WebRequest<string, r>;
export type R<T> = Req<T>;
// promise response
export type PromReq<r> = Promise<R<r>>;
export type PR<T> = PromReq<T>;

export type StdV1<r> = (opts: Auth) => PR<r>

export const SortMethodRT = t.refinement(t.number, (v) => {
    return (v in SortMethod)
}, "SortMethodRT")

export const SortedRT = t.type({
    sortMethod: SortMethodRT
})
export type Sorted = t.TypeOf<typeof SortedRT>

export type Conditional<T> = {
    query: FilterQuery<T>
}

export type GetArbitraryPartial<T> = Auth & Partial<Paginated & Sorted & Conditional<T>>




// Auth + Juri 2.0 Stuff

export const _JuriRT = t.refinement(t.array(t.string), (xs: string[]) =>
    xs.length >= 1
    && xs[0] === ""
    && xs.length < 4
    && xs.every(fragment => fragment.length < 10)
)
export type _Juri = t.TypeOf<typeof _JuriRT>


export enum AuthLvls {
    User = "user",
    None = "none",
    Finance = "finance",
    Admin = "admin",
    GeneralMemberMgmt = "genMemberMgmt",
    PrivateMemberMgmt = "privMemberAdmin",
    VolunteerMgmt = "volunteerMgmt",
}

const _AL = AuthLvls

export class _Auth {
    public isAuth: boolean = true;

    private constructor(public authLevel: string, public authJuri: Option<_Juri>) {
        authJuri.map((_j: _Juri) => ThrowReporter.report(_JuriRT.decode(_j)))
    }

    private static mk1 = (role: string) => new _Auth(role, none)
    private static mk2 = (role: string) => (juri: _Juri) => new _Auth(role, none)

    static User = () => _Auth.mk1(_AL.User)
    isUser() { return this.authLevel == _AL.User }

    static None = () => _Auth.mk1(_AL.None)
    isNone() { return this.authLevel == _AL.None }

    static Admin = () => _Auth.mk1(_AL.Admin)
    isAdminn() { return this.authLevel == _AL.Admin }

    static Finance = _Auth.mk2(_AL.Finance)
    isFinance() { return this.authLevel == _AL.Finance }

    static GeneralMemberMgmt =  _Auth.mk2(_AL.GeneralMemberMgmt)
    isGeneralMemberMgmt() { return this.authLevel == _AL.GeneralMemberMgmt }

    static PrivateMemberMgmt = _Auth.mk2(_AL.PrivateMemberMgmt)
    isPrivateMemberMgmt() { return this.authLevel == _AL.PrivateMemberMgmt }

    static VolunteerMgmt = _Auth.mk2(_AL.VolunteerMgmt)
    isVolunteerMgmt() { return this.authLevel == _AL.VolunteerMgmt }
}
