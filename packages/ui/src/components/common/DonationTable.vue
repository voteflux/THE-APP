<template>
    <div>
        <good-table
            :columns="donationRowsToRender"
            :rows="getDonations()"
            max-height="800px"
            :pagination-options="{
                enabled: true,
                mode: 'pages',
                perPage: 10,
                position: 'top',
                perPageDropdown: [5, 10, 20, 50, 100],
                dropdownAllowAll: false,
                nextLabel: 'next',
                prevLabel: 'prev',
                rowsPerPageLabel: 'Rows per page',
                ofLabel: 'of',
                pageLabel: 'page', // for 'pages' mode
                allLabel: 'All',
            }"
            >
            <!-- :fixed-header="true" -->
            <div slot="emptystate">
                No donations to display.
            </div>
        </good-table>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PropOptions } from "vue/types/options";
import { Donation } from "flux-lib/types/db";

const _str = (s, label?: string) => ({ field: s, label: label === undefined ? s : label, filterable: true });
const _num = (s, label?: string) => ({ ..._str(s, label), type: "number" });

export default Vue.extend({
    props: {
        donations: {
            type: Array,
            required: true
        } as PropOptions<Donation[]>
    },
    data: () => ({
        donationRowsToRender: [
            _str("_id", "DB _ID"),
            _str("id", "Donation ID"),
            _num("ts", "Timestamp"),
            _str("date"),
            _str("name", "Name"),
            _str("email"),
            _num("amount"),
            _str("unit"),
            _str("street"),
            _str("city"),
            _str("state"),
            _str("postcode"),
            _str("country"),
            _str("comment"),
            _num("amount_aud")
        ]
    }),
    created(){
        console.log(this.donations)
    },
    methods: {
        getDonations() {
            return this.donations.map(d => ({
                ...d,
                comment: d.extra_data.comment || "",
                aud_value: d.extra_data.aud_value || d.amount,
                date: d.date || "",
            }))
        }
    }
});
</script>

<style lang="scss" scoped>
</style>
