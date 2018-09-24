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

import NavItem from './NavItem.vue'
import R from '@/routes'
import { Req } from 'flux-lib/types/db/api'
import { RolesResp } from 'flux-lib/types/db'

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
        navItems: [
            { name: "Home", icon: "home", route: R.Dashboard },
            { name: "Your Profile", icon: "person", items: [
                { name: "Your Details", route: R.EditUserDetails , icon: 'home'}
            ] },
            { name: "Volunteer", items: [

            ]},
            { name: "Be a Candidate", items: [

            ]},
        ],
        _value: false
    }),
    methods: {
        updateInput(newVal) {
            this.$emit("input", newVal)
        }
    },
    created() {
        if (this.roles.isSuccess()) {
            this.navItems.push({
                name: "Admin", items: [

                ]
            })
        }
    },
    mounted() {
        this._value = this.$props.value
    }
});
</script>
