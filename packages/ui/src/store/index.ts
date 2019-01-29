import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import * as Vols from './volunteers'
import * as App from './app'
import * as Qanda from './qanda'


export const shouldRefresh = (store: FullStore, f: string) => Date.now() - (15 * 1000) > (store.state._lastCalled[f] || 0);


export const store = new Vuex.Store({
    state: {
        ...Vols.state,
        ...App.state,
        ...Qanda.state,
        _lastCalled: {},
    } as Vols.VolState & App.AppState & Qanda.QandaState & {_lastCalled: {[f:string]: number}},
    mutations: new Proxy({
        ...Vols.mutations,
        ...App.mutations,
        ...Qanda.mutations
    }, {
        get(target, p: PropertyKey, receiver: any): any {
            return (state, ...args) => { state._lastCalled[p] = Date.now(); return target[p](state, ...args); }
        }
    }) as Vols.VolMuts & App.AppMuts & Qanda.QandaMuts
})

export type FullState = typeof store.state

export type FullStore = typeof store