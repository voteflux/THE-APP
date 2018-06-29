<template>
    <div class="br3 ba pa3">
        <div class="flex flex-column">
            <div class="flex mb2">
                <div class="dib mr4">
                    ID: <code>{{ donation.id }}</code>
                </div>
                <div class="dib mr4">
                    Date: {{ donation.date }} (<small><code>{{ donation.ts }}</code></small>)
                </div>
            </div>
            <div class="flex mb2">
                <div class="dib mr4">
                    Amount: <code>{{ donation.amount }} {{ donation.unit }}</code>
                </div>
                <div class="dib mr4">
                    Branch: <code>{{ donation.branch }}</code>
                </div>
            </div>
            <div class="flex mb2">
                <div class="dib mr4">
                    <strong>Name:</strong>&nbsp;<code>{{ donation.name }}</code> (<code>{{ donation.email }}</code>)
                </div>
            </div>
            <div class="flex mb2">
                <strong class="mr3">Address:</strong>
                <div class="mr4">
                    {{ donation.street }}<br>
                    {{ donation.city }}<br>
                    {{ donation.state }}, {{ donation.postcode }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Donation } from '@/lib/api';
export default Vue.extend({
    props: {
        donation: Object as () => Donation,
    }
})
</script>

<style lang="scss" scoped>
@import "tachyons";



</style>
