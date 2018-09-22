<template>

    <center class="mt3">
        <p>
            Please sign in the box below:<br>
            <small class="em">Note: nothing is saved to our servers without your permission.</small>
        </p>
        <vueSignature class="ba db" ref="signature" :sigOption="sigOpts" :w="'500px'" :h="'320px'"></vueSignature>
        <div class="mt4 flex flex-row items-center justify-around" style="max-width: 500px;">
            <button @click="clear()">Clear</button>
            <button @click="undo()">Undo</button>
            <button @click="save()">Save</button>
        </div>
    </center>


</template>

<script lang="ts">
import Vue from 'vue'
import { VolFs } from '../../../store/volunteers';
// import routes from '../../routes';
export default Vue.extend({
    props: {
        onSave: {
            default: (sig) => {}
        }
    },
    data: () => ({
        sigOpts: {
            penColor:"rgb(0, 0, 0)",
            backgroundColor:"rgb(255,255,255)"
        }
    }),

    methods: {
        clear() {
            // @ts-ignore
            this.$refs.signature.clear();
        },

        undo() {
            // @ts-ignore
            this.$refs.signature.undo();
        },

        save() {
            // @ts-ignore
            const sig = this.$refs.signature.save('image/png')
            // this.$refs.signature.save('image/jpeg')
            this.$store.commit(VolFs.setNda, sig)
            // this.$router.push({ path: routes.VolunteerDashboard })
            this.onSave(sig)
        }
    }
})
</script>

<style scoped>
.root {
    /* width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0; */
}
</style>
