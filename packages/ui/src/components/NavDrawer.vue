<template>
    <v-navigation-drawer clipped :value="value" @input="updateInput" enable-resize-watcher app>
        <v-toolbar flat>The Flux App</v-toolbar>
        <v-list>
            <NavItem v-for="item in navItems()" :key="item.name" :item="item"></NavItem>
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
                { name: "Revoke Your Membership", route: R.MembershipRevocation },
            ] },
            { name: "Q And A (AGM)", icon: "question_answer", route: R.MembersQAndA },
            // { name: "Volunteer", items: [
            //     { name: "NDA Status", route: R.VolunteerNdaStatusAndSign },
            // ]},
            // { name: "Be a Candidate", items: [
                //
            // ]},
        ],
        _value: false
    }),
    computed: {
    },
    methods: {
        navItems() {
            console.log(this.items)
            if (this.roles.isSuccess()) {
                const permissionedItems: [string, NavItemRec][] = [
                    [Roles.FINANCE, { name: "Finance", items: [
                        { name: "Donation Log", route: R.FinanceDonationLog },
                        { name: "Donation Entry (Manual)", route: R.FinanceDonationEntry}
                    ]}],
                    [Roles.ADMIN, { name: "Admin", items: [{ name: "Audit Roles", route: R.AdminAuditRoles }] }],


                    // ['any', { name: "Staff UI", href: "/admin", icon: "web" }]
                ]

                const filteredItems = Ramda.filter(([role, item]) => this.hasRole(role), permissionedItems)
                const extraItems = Ramda.map(([r,i]) => i, filteredItems)

                if (this.hasAnyRole()) {
                    extraItems.push({ name: "Staging UI", href: "https://staging.app.flux.party/v/", icon: "launch" })
                }

                return Ramda.concat(this.items as NavItemRec[], extraItems)
            }
            return this.items
        },
        updateInput(newVal) {
            this.$emit("input", newVal)
        },
        hasRole(r: string) {
            const rs = this.$props.roles
            if (rs.isSuccess && rs.isSuccess()) {
                const _rs = rs.unwrap()
                if (_rs.roles)
                    return rs.unwrap().roles.includes(r) || rs.unwrap().roles.includes("admin")
                return false
            }
            return false
        },
        hasAnyRole() {
            const rs = this.$props.roles
            if (rs.isSuccess()) {
                return (rs.unwrap() || {roles:[]}).roles.length > 0
            }
            return false;
        },
    },
    created() {
    },
    mounted() {
        this._value = this.$props.value
    }
});
</script>
