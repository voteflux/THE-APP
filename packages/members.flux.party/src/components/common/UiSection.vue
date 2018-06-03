<template>
    <div class="mt2 tl">
        <h2 class="bb ph2">{{ title }}</h2>
        <div class="ph2">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: ["title"]
};
</script>
