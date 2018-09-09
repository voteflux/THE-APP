import { FilterQuery } from 'mongodb';
import { SortMethod, Paginated } from './index';
import WebRequest from '../../WebRequest';
import * as t from 'io-ts'

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
