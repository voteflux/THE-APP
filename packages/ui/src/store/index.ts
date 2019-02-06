import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import * as Vols from './volunteers'
import * as App from './app'
import * as Qanda from './qanda'


const lcKey = (f, args) => `${f}|${args || []}`


/**
 * map mutation + keys used for lookup or setting in a dict, etc, to a unique-ish string, and return whether we should refresh that state entry (every 15 min)
 * @param store
 * @param f: String - the mutation
 * @param args: Array(any) - a list of args
 */
export const shouldRefresh = (store: FullStore, f: string, args?) => (Date.now() - (15 * 60 * 1000)) > (store.state._lastCalled[lcKey(f, args)] || 0);


export const store = new Vuex.Store({
    state: {
        ...Vols.state,
        ...App.state,
        ...Qanda.state,
        _lastCalled: {},
    } as Vols.VolState & App.AppState & Qanda.QandaState & {_lastCalled: {[f:string]: number}},
    mutations: {
        ...Vols.mutations,
        ...App.mutations,
        ...Qanda.mutations
    } as Vols.VolMuts & App.AppMuts & Qanda.QandaMuts,
    // getters: {
    //     // ...Qanda.getters
    // },
    // actions: {
    //     // ...Qanda.actions
    // }
})

export type FullState = typeof store.state

export type FullStore = typeof store