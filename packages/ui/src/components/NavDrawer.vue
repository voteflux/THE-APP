<template>
    <v-navigation-drawer clipped :value="value" @input="updateInput" enable-resize-watcher app>
        <v-toolbar flat>The Flux App</v-toolbar>
        <v-list>
            <NavItem v-for="item in navItems" :key="item.name" :item="item" />
        </v-list>
    </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from "vue";
import * as Ramda from 'ramda'

import NavItem from './NavItem.vue'
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
        navItems() {
            if (this.roles.isSuccess()) {
                return Ramda.concat(this.items, [{
                    name: "Admin",
                    items: Ramda.map(([r,i]) => i, Ramda.filter(([role, link]) => this.hasRole(role), [
                        [Roles.FINANCE, { name: "Finance", route: R.FinanceMenu }],
                        [Roles.ADMIN, { name: "Audit Roles", route: R.AdminAuditRoles }]
                    ]))
                }])
            }
            return this.items
        }
    },
    methods: {
        updateInput(newVal) {
            this.$emit("input", newVal)
        },
        hasRole(r) {
            const rs = this.$props.roles
            if (rs.isSuccess()) {
                return rs.unwrap().includes(r) || rs.unwrap().includes("admin")
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
