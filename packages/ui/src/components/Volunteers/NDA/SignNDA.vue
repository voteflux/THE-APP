<template>

    <center class="mt3">
        <p>
            Please sign in the box below:<br>
            <small class="em">Note: nothing is saved to our servers without your permission.</small>
        </p>
        <vueSignature class="ba db" ref="signature" :sigOption="sigOpts" :w="'500px'" :h="'320px'"></vueSignature>
        <div class="mt4 flex flex-row items-center justify-around" style="max-width: 500px;">
            <v-btn color="" @click="back()">Back</v-btn>
            <v-btn color="warning" @click="clear()">Clear</v-btn>
            <v-btn @click="undo()">Undo</v-btn>
            <v-btn color="success" @click="save()">Save</v-btn>
        </div>
    </center>


</template>

<script lang="ts">
import Vue from 'vue'
import { VolFs } from '../../../store/volunteers';
// import routes from '../../routes';

const defaultFunc: { (): void, isDefault?: boolean } = () => {}
defaultFunc.isDefault = true

export default Vue.extend({
    props: {
        onSave: {
            default: (sig) => {}
        },
        onBack: {
            default: defaultFunc
        }
    },
    data: () => ({
        sigOpts: {
            penColor:"rgb(0, 0, 0)",
            backgroundColor:"rgb(255,255,255)"
        }
    }),

    methods: {
        showBack() {
            // @ts-ignore
            return !this.onBack.isDefault
        },

        back() {
            this.onBack()
        },

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
            this.$store.commit(VolFs.setNda, sig)
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
