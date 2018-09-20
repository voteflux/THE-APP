import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import * as Volunteers from './volunteers'

export const store = new Vuex.Store({
    state: {
        ...Volunteers.state,
    } as Volunteers.VolState & {},
    mutations: {
        ...Volunteers.mutations,
    } as Volunteers.VolMuts & {}
})
