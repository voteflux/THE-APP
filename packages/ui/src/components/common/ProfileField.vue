<template>
    <div class="mb4">
        <div class="subheading">{{field.title}}
            <loading v-if="savingWR.isLoading()"></loading>
        </div>
        <div class="pl2">
            <div v-if="field.type === 'checklist'">
                <v-checkbox v-for="opt in field.params.options" :key="opt" v-model="checklistVal" :label="opt" :value="opt"
                            height="20px" hide-details @change="saveField()" multiple></v-checkbox>
                <v-checkbox v-if="field.params.allow_others" v-model="provideOther" label="Other" height="20px"
                            hide-details></v-checkbox>
                <v-expand-transition>
                    <v-text-field v-if="provideOther" label="Other (Details)" v-model="otherDetails" class="mt2"
                                  @blur="saveField()"></v-text-field>
                </v-expand-transition>
                <error v-if="savingWR.isFailed()">{{ savingWR.unwrapError() }}</error>
            </div>
            <div v-else-if="field.type === 'radio'">
                <v-radio-group row v-model="radioVal" height="20px" hide-details @click="saveField()">
                    <v-radio v-for="opt in field.params.options" :key="opt" :label="opt" :value="opt"
                             hide-details></v-radio>
                </v-radio-group>
            </div>
            <div v-else-if="field.type === 'textarea'">
                <v-textarea label="Your Response" rows='3' v-model="textareaVal" hide-details
                            @blur="saveField()"></v-textarea>
            </div>
            <div v-else-if="field.type === 'text'">
                <v-text-field label="Your Response" v-model="textVal" hide-details @blur="saveField()"></v-text-field>
            </div>
            <div v-else-if="field.type === 'slider'">
                <v-slider :min="field.params.min" :max="field.params.max" :step="field.params.step" v-model="sliderVal"
                          @change="saveField()" hide-details thumb-label="always"></v-slider>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue'
    import WebRequest from 'flux-lib/WebRequest'


    export default Vue.extend({
        name: "ProfileField",
        props: ['field', 'profileType', 'initValue'],
        data: () => ({
            sliderVal: 0,
            checklistVal: [],
            textVal: '',
            textareaVal: '',
            radioVal: '',
            savingWR: WebRequest.NotRequested(),
            provideOther: false,
            otherDetails: '',
        }),
        methods: {
            getVal () {
                return this[`${this.field.type}Val`]
            },
            setVal (val) {
                this[`${this.field.type}Val`] = val;
            },
            async saveField () {
                const doc = {[this.field.name]: {value: this.getVal()}}
                if (this.provideOther && this.otherDetails.length > 0) {
                    doc[this.field.name].otherDetails = this.otherDetails
                }
                console.log(doc)
                this.$flux.profiles.patchMyProfile(this.profileType, doc)
            }
        },
        created() {
            if (this.field.type === 'slider:int') {
                this.sliderVal = this.field.default || 0
            }
            if (this.initValue) {
                this.setVal(this.initValue.value);
                this.otherDetails = this.initValue.otherDetails || '';
                this.provideOther = this.otherDetails && this.otherDetails !== '';
            }
        },
    })
</script>

<style scoped>

</style>