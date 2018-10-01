import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import * as Vols from './volunteers'
import * as App from './app'

export const store = new Vuex.Store({
    state: {
        ...Vols.state,
        ...App.state,
    } as Vols.VolState & App.AppState,
    mutations: {
        ...Vols.mutations,
        ...App.mutations,
    } as Vols.VolMuts & App.AppMuts
})
