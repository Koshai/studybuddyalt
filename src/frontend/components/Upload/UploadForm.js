
// components/Forms/UploadForm.js

window.UploadFormForm = {
    template: `
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-for="field in fields" :key="field.name" class="form-field">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ field.label }}
            </label>
            <input
                v-model="formData[field.name]"
                :type="field.type"
                :placeholder="field.placeholder"
                :required="field.required"
                class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
            />
        </div>
        
        <button
            type="submit"
            :disabled="!isValid"
            class="w-full btn-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
            {{ submitText }}
        </button>
    </form>
    `,

    props: {
        fields: Array,
        submitText: {
            type: String,
            default: 'Submit'
        }
    },

    setup(props, { emit }) {
        const formData = Vue.reactive({});
        
        // Initialize form data
        props.fields.forEach(field => {
            formData[field.name] = field.default || '';
        });

        const isValid = Vue.computed(() => {
            return props.fields.every(field => {
                return !field.required || formData[field.name];
            });
        });

        const handleSubmit = () => {
            if (isValid.value) {
                emit('submit', formData);
            }
        };

        return {
            formData,
            isValid,
            handleSubmit
        };
    },

    emits: ['submit']
};