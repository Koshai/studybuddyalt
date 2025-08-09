// src/frontend/components/Modals/CreateTopic.js
window.CreateTopicModal = {
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-emerald-50 rounded-2xl p-8 w-full max-w-md animate-scale-in">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-emerald-900">Add New Topic</h3>
                <button
                    @click="store.hideCreateTopicModal()"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div v-if="store.state.selectedSubject" class="mb-4 p-3 bg-primary-50 rounded-lg">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                        {{ store.state.selectedSubject.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-primary-700">{{ store.state.selectedSubject.name }}</p>
                        <p class="text-xs text-primary-600">Adding topic to this subject</p>
                    </div>
                </div>
            </div>
            
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <ValidatedInput
                    v-model="store.state.newTopic.name"
                    type="text"
                    label="Topic Name"
                    placeholder="e.g., Algebra, Biology Basics, World War 2"
                    :validator="validateTopicName"
                    :required="true"
                    help-text="Choose a clear, descriptive name for your topic"
                    @validation-change="onNameValidation"
                    ref="nameInput"
                />
                
                <ValidatedInput
                    v-model="store.state.newTopic.description"
                    type="textarea"
                    label="Description (Optional)"
                    placeholder="What specific concepts will this topic cover?"
                    :validator="validateDescription"
                    :required="false"
                    :validator-options="{ required: false, maxLength: 500 }"
                    help-text="Optional: Add details about what this topic covers"
                    @validation-change="onDescriptionValidation"
                />
                
                <div class="flex space-x-3 pt-4">
                    <button
                        type="submit"
                        :disabled="!isFormValid || creating"
                        class="flex-1 btn-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i v-if="!creating" class="fas fa-plus mr-2"></i>
                        <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                        {{ creating ? 'Creating...' : 'Add Topic' }}
                    </button>
                    <button
                        type="button"
                        @click="store.hideCreateTopicModal()"
                        class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const creating = Vue.ref(false);
        const nameInput = Vue.ref(null);
        
        // Form validation state
        const nameValidation = Vue.ref({ isValid: false, errors: [] });
        const descriptionValidation = Vue.ref({ isValid: true, errors: [] });

        // Validation methods
        const validateTopicName = (name) => {
            return window.ValidationUtils.validateTopicName(name);
        };

        const validateDescription = (description, options) => {
            return window.ValidationUtils.validateDescription(description, options);
        };

        const onNameValidation = (result) => {
            nameValidation.value = result;
        };

        const onDescriptionValidation = (result) => {
            descriptionValidation.value = result;
        };

        const isFormValid = Vue.computed(() => {
            return nameValidation.value.isValid && 
                   descriptionValidation.value.isValid && 
                   store.state.newTopic.name.trim();
        });

        const handleSubmit = async () => {
            if (!store.state.newTopic.name.trim() || !store.state.selectedSubject) return;

            creating.value = true;
            try {
                const topic = await window.api.createTopic(
                    store.state.selectedSubject.id,
                    store.state.newTopic.name,
                    store.state.newTopic.description
                );
                
                store.addTopic(topic);
                store.hideCreateTopicModal();
                store.showNotification('Topic created successfully!', 'success');
            } catch (error) {
                console.error('Error creating topic:', error);
                store.showNotification('Failed to create topic', 'error');
            } finally {
                creating.value = false;
            }
        };

        // Focus input when modal opens
        Vue.onMounted(() => {
            Vue.nextTick(() => {
                // Access the actual input element inside the ValidatedInput component
                const inputElement = nameInput.value?.$refs?.input || nameInput.value?.$el?.querySelector('input');
                if (inputElement && typeof inputElement.focus === 'function') {
                    inputElement.focus();
                }
            });
        });

        return {
            store,
            creating,
            nameInput,
            nameValidation,
            descriptionValidation,
            validateTopicName,
            validateDescription,
            onNameValidation,
            onDescriptionValidation,
            isFormValid,
            handleSubmit
        };
    }
};