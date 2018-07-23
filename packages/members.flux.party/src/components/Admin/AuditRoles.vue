<template>
    <div>
        <flux-logo title="Role Audit"/>
        <p>
            Current date: {{ (new Date()).toString() }}
        </p>

        <Error v-if="req.roleAudit.isFailed()">{{ req.roleAudit.unwrapError() }}</Error>
        <Loading v-else-if="!req.roleAudit.isSuccess()">Loading all permissions...</Loading>
        <div v-else>
            <button @click="save">Save Spreadsheet</button>
            <UiSection v-for="(r, i) in req.roleAudit.unwrap()" :key="i" :title="genRoleHeading(r)">
                <TableNCols :data="r.users" :headings="headings" :prettyHeadings="prettyHeadings()" class="table"/>
            </UiSection>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { UiSection, Warning, Error } from "../common";
import Loading from '../Loading.vue'
import {TableNCols} from '../common'
import { extractProps } from '@/lib/process'

import Routes from "@/routes"
import Roles from "@/lib/roles";
import { Auth, UserV1Object, RoleResp } from '@/lib/api';

import WebRequest from "@/lib/WebRequest";

import XLSX from 'xlsx';
import * as R from 'ramda';


export default Vue.extend({
    components: { UiSection, Loading, Error, TableNCols },
    props: {
        auth: Object as () => Auth,
    },
    data: () => ({
        req: {
            roleAudit: WebRequest.NotRequested()
        },
        headings: ['fname', 'sname', 'email', 'contact_number', 'addr_suburb']
    }),
    methods: {
        genRoleHeading(r) {
            return `Role: ${r.role}`
        },
        getRoleAudit() {
            this.req.roleAudit = WebRequest.Loading()
            this.$flux.v2.getRoleAudit({...this.$props.auth}).then(r => this.req.roleAudit = r)
        },
        prettyHeadings() {
            return {
                fname: 'First Name',
                sname: 'Surname',
                contact_number: "Ph Number",
                addr_suburb: 'Suburb',
                email: "Email"
            }
        },
        save() {
            const roles = this.req.roleAudit.unwrap() as RoleResp[]
            const wb = XLSX.utils.book_new()
            const prettyHeadings = this.prettyHeadings()
            const ts = (new Date()).getTime() / 1000 | 0
            R.mapObjIndexed(({role, users}, i) => {
                const rows: any[] = R.concat(
                    [[`${role} ::: Role Audit at ${ts}`], R.props(this.headings, prettyHeadings)],
                    R.map(R.compose(R.map(p => p.toString()), extractProps(this.headings)), users)
                )
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), `Role (${role.replace(/\//g, '.').replace(/\:/g, '_')})`)
            }, roles);
            XLSX.writeFile(wb, `fluxRoleAudit.${ts}.xlsx`)
        }
    },
    mounted() {
        this.getRoleAudit()
    }
})
</script>

<style>
.table {
    width: 100%;
}
</style>
