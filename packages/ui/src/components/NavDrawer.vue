<template>
    <v-navigation-drawer clipped :value="value" @input="updateInput" enable-resize-watcher app>
        <v-toolbar flat>The Flux App</v-toolbar>
        <v-list>
            <NavItem v-for="item in navItems()" :key="item.name" :item="item" />
        </v-list>
    </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from "vue";
import * as Ramda from 'ramda'

import NavItem, { NavItemRec } from './NavItem.vue'
import R from '@/routes'
import { Req } from 'flux-lib/types/db/api'
import { RolesResp } from 'flux-lib/types/db'
import Roles from "../lib/roles"

export default Vue.extend({
    components: { NavItem },
    props: {
        value: {
            type: Boolean,
            default: false
        },
        roles: {
            type: Object as () => Req<RolesResp>
        }
    },
    data: () => ({
        items: [
            { name: "Home", icon: "home", route: R.Dashboard },
            { name: "Your Profile", icon: "person", items: [
                { name: "Your Details", route: R.EditUserDetails },
                { name: "Revoke Your Membership", route: R.MembershipRevocation }
            ] },
            { name: "Volunteer", items: [

            ]},
            { name: "Be a Candidate", items: [

            ]},
        ],
        _value: false
    }),
    computed: {
    },
    methods: {
        navItems() {
            if (this.roles.isSuccess()) {
                const permissionedItems: [string, NavItemRec][] = [
                    [Roles.FINANCE, { name: "Finance", items: [
                        { name: "Donation Log", route: R.FinanceDonationLog },
                        { name: "Donation Entry (Manual)", route: R.FinanceDonationEntry}
                    ]}],
                    [Roles.ADMIN, { name: "Admin", items: [{ name: "Audit Roles", route: R.AdminAuditRoles }] }],
                ]

                const filteredItems = Ramda.filter(([role, link]) => this.hasRole(role), permissionedItems)
                const extraItems = Ramda.map(([r,i]) => i, filteredItems)

                return Ramda.concat(this.items, extraItems)
            }
            return this.items
        },
        updateInput(newVal) {
            this.$emit("input", newVal)
        },
        hasRole(r: string) {
            const rs = this.$props.roles
            if (rs.isSuccess()) {
                return rs.unwrap().roles.includes(r) || rs.unwrap().roles.includes("admin")
            }
            return false
        },
    },
    created() {
    },
    mounted() {
        this._value = this.$props.value
    }
});
</script>
