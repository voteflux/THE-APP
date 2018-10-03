<template>
    <div>
        <v-flex class="justify-around mb4" v-if="canEdit">
            <v-btn @click="editing = true">Edit Profile</v-btn>
        </v-flex>

        <v-flex class="flex-column">

        </v-flex>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props: {
        canEdit: {
            type: Boolean,
            default: true,
            required: false,
        },
    },
})
</script>
