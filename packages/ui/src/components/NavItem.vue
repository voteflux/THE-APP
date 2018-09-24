<template>
    <component v-bind:is="thisComponent()" :sub-group="isSublist() && !isRoot" :no-action="isSublist()" :value="getValue()" v-on="getOnHandlers()" >
        <v-list-tile v-if="isSublist()" slot="activator">
            <v-list-tile-action v-if="item.icon">
                <v-icon v-text="item.icon" />
            </v-list-tile-action>
            <v-list-tile-title>{{ item.name }}</v-list-tile-title>
        </v-list-tile>

        <NavItem v-if="isSublist()" v-for="i2 in item.items" :key="i2.name" :isRoot="false" :item="i2" />

        <v-list-tile-action v-if="isSingle() && item.icon && isRoot">
            <v-icon v-text="item.icon" />
        </v-list-tile-action>
        <v-list-tile-title v-if="isSingle()">{{ item.name }}</v-list-tile-title>
        <v-list-tile-action v-if="isSingle() && item.icon && !isRoot">
            <v-icon v-text="item.icon" />
        </v-list-tile-action>
    </component>
</template>

<script lang="ts">
import Vue from 'vue'
import * as t from 'io-ts'

import Routes from '@/routes'

type _NavItemH = {
    icon?: string,
    name: string
}
type NavItemH1I = {
    route: string
} & _NavItemH
type NavItemH2I = {
    items: NavItemRec[]
} & _NavItemH
type NavItemRec = NavItemH1I | NavItemH2I

const isSingle = (n: any): n is NavItemH1I => !!n.route
const isSublist = (n: any): n is NavItemH2I => !!n.items

export default Vue.extend({
    name: 'NavItem',
    props: {
        item: {
            type: Object as () => NavItemRec,
            required: true
        },
        isRoot: {
            type: Boolean,
            default: true
        }
    },
    methods: {
        isSingle() { return isSingle(this.item) },
        isSublist() { return isSublist(this.item) },
        thisComponent() { return this.isSublist() ? 'v-list-group' : 'v-list-tile' },
        getValue() {
            return (isSingle(this.item) && this.$route.path === this.item.route) // || this.isSublist()   // returning true for a list will start it open
        },
        getOnHandlers() {
            const onClick = isSingle(this.item) ? { click: () => { this.$router.push((this.item as NavItemH1I).route) }} : {}
            return {
                ...onClick
            }
        },
    },
})
</script>
