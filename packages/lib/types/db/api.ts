import { FilterQuery } from 'mongodb';
import { SortMethod, Paginated } from './index';
import WebRequest from '../../WebRequest';
import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import { Maybe } from 'tsmonad';

export interface Auth {
  apiToken?: string;
  s: string | undefined;
}
export type Req<r> = WebRequest<string, r>;
export type R<T> = Req<T>;
// promise response
export type PromReq<r> = PromiseLike<R<r>>;
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

    private constructor(public authLevel: string, public authJuri: Maybe<_Juri>) {
        authJuri.caseOf({
            nothing: () => {},
            just: (_j: _Juri) => ThrowReporter.report(_JuriRT.decode(_j))
        })
    }

    private static mk1 = (role: string) => new _Auth(role, Maybe.nothing())
    private static mk2 = (role: string) => (juri: _Juri) => new _Auth(role, Maybe.just(juri))

    static User = () => _Auth.mk1(_AL.User)

    static None = () => _Auth.mk1(_AL.None)

    static Admin = () => _Auth.mk1(_AL.Admin)

    static Finance = _Auth.mk2(_AL.Finance)

    static GeneralMemberMgmt =  _Auth.mk2(_AL.GeneralMemberMgmt)

    static PrivateMemberMgmt = _Auth.mk2(_AL.PrivateMemberMgmt)

    static VolunteerMgmt = _Auth.mk2(_AL.VolunteerMgmt)
}
