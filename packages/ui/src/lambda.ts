import { Store } from 'vuex'
import WebRequest, {wrMap} from "flux-lib/WebRequest";
import {identity} from "fp-ts/lib/function";
import {FullStore, shouldRefresh} from "@/store";

export const get = (k: string) => <D>(o: D) => o[k];

export async function apply_to_or<D,R>(f1: (d: D) => R, d: D | null | undefined, f2: () => Promise<R>) {
    if (d) { return f1(d) } else { return await f2() }
}


export function isStateEntryEmpty(v: object | any[] | any) {
    if (typeof v === "object" || Array.isArray(v)) {
        return v.length === 0
    }
    return !v;
}


export async function get_from_state_or_cache<E,D,R>(store: FullStore, d: D, f: () => Promise<WebRequest<E,D>>, mutation: string, genArgs?) {
    console.log(mutation, 'data>', d)
    const d2 = await f()
    const _genArgs = genArgs ? genArgs : identity
    d2.do({success: v => store.commit(mutation, _genArgs(v))})
    return d2
}
