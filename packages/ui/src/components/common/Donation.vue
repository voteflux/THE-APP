<template>
    <div class="br3 ba">
        <!-- small version -->
        <div v-if="small" class="flex flex-column ma2">
            <div>
                ID: <span>{{donation.id}}</span>
            </div>
            <div>
                Name: <strong class="d-name">{{donation.name}}</strong>
            </div>
            <div>
                Date: <strong class="d-date">{{donation.date}}</strong> (<small>{{donation.ts}}</small>)
            </div>
        </div>

        <!-- row version -->
        <div v-else-if="row" class="flex flex-row pa1 donation-row">
            <span>{{ donation.id }}</span>
            <span>{{ donation.name }}</span>
            <span>{{ donation.email }}</span>
            <span>{{ donation.ts }}</span>
            <span>{{ donation.date }}</span>
            <span>{{ donation.source }}</span>
            <span>{{ donation.amount }}</span>
            <span>{{ donation.unit }}</span>
            <span>{{ donation.branch }}</span>
            <span>{{ donation.street }}</span>
            <span>{{ donation.city }}</span>
            <span>{{ donation.state }}</span>
            <span>{{ donation.postcode }}</span>
            <span>{{ donation.country }}</span>
        </div>

        <!-- large version -->
        <div v-else class="flex flex-column ma3">
            <div class="flex flex-row flex-wrap mb2">
                <div class="dib mr4">
                    ID: <code>{{ donation.id }}</code>
                </div>
                <div class="dib mr4">
                    Date: <strong class="d-date">{{ donation.date }}</strong> (<small><code>{{ donation.ts }}</code></small>)
                </div>
                <div class="dib mr4">
                    Source: {{ donation.payment_source }}
                </div>
            </div>
            <div class="flex mb2 flex-wrap">
                <div class="dib mr4">
                    Amount: <code class="">{{ donation.amount }} {{ donation.unit }}</code>
                </div>
                <div class="dib mr4">
                    Branch: <code>{{ donation.branch }}</code>
                </div>
            </div>
            <div class="flex mb2">
                <div class="dib mr4">
                    Name:&nbsp;<strong class="d-name"><code>{{ donation.name }}</code></strong>&nbsp;<small class="d-email">(<code>{{ donation.email }}</code>)</small>
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
        small: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        row: false
    })
})
</script>

<style lang="scss" scoped>
@import "tachyons";

.d-name {
    @extend .green;
}

.d-date {
    @extend .blue;
}

.d-email {
    @extend .orange;
}

.donation-row {

}

.donation-row span {
    // @extend .bl1
}

</style>
