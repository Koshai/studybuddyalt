// src/frontend/components/Modals/CreateSubject.js - SIMPLIFIED VERSION
window.CreateSubjectModal = {
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 w-full max-w-md animate-scale-in">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-900">Create New Subject</h3>
                <button
                    @click="store.hideCreateSubjectModal()"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                    <input
                        v-model="store.state.newSubject.name"
                        type="text"
                        class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                        placeholder="e.g., Mathematics, Science, History"
                        required
                        ref="nameInput"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea
                        v-model="store.state.newSubject.description"
                        class="form-input w-full px-4 py-3 rounded-lg focus:outline-none resize-none"
                        rows="3"
                        placeholder="Brief description of what you'll study in this subject"
                    ></textarea>
                </div>

                <!-- Category Selection (only show if categories are available) -->
                <div v-if="categoriesAvailable && categories.length > 0">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                    <select
                        v-model="selectedCategoryId"
                        class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                    >
                        <option value="">Choose a category...</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">
                            {{ category.name }}
                        </option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">Categories help AI generate better questions for your subject</p>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button
                        type="submit"
                        :disabled="!store.state.newSubject.name.trim() || creating"
                        class="flex-1 btn-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i v-if="!creating" class="fas fa-plus mr-2"></i>
                        <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                        {{ creating ? 'Creating...' : 'Create Subject' }}
                    </button>
                    <button
                        type="button"
                        @click="store.hideCreateSubjectModal()"
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
        const categories = Vue.ref([]);
        const categoriesAvailable = Vue.ref(false);
        const selectedCategoryId = Vue.ref('');

        // Try to load categories when modal opens
        const loadCategories = async () => {
            try {
                if (window.api.getSubjectCategories) {
                    const cats = await window.api.getSubjectCategories();
                    categories.value = cats || [];
                    categoriesAvailable.value = cats && cats.length > 0;
                    console.log('Categories loaded:', cats?.length || 0);
                }
            } catch (error) {
                console.warn('Categories not available:', error);
                categoriesAvailable.value = false;
            }
        };

        const handleSubmit = async () => {
            if (!store.state.newSubject.name.trim()) return;

            creating.value = true;
            try {
                console.log('Creating subject with data:', {
                    name: store.state.newSubject.name,
                    description: store.state.newSubject.description,
                    categoryId: selectedCategoryId.value || null
                });

                const subject = await window.api.createSubject(
                    store.state.newSubject.name,
                    store.state.newSubject.description,
                    selectedCategoryId.value || null
                );
                
                console.log('Subject created successfully:', subject);
                
                store.addSubject(subject);
                store.hideCreateSubjectModal();
                store.showNotification('Subject created successfully!', 'success');
            } catch (error) {
                console.error('Error creating subject:', error);
                store.showNotification('Failed to create subject: ' + error.message, 'error');
            } finally {
                creating.value = false;
            }
        };

        // Load categories when component mounts
        Vue.onMounted(async () => {
            await loadCategories();
            Vue.nextTick(() => {
                nameInput.value?.focus();
            });
        });

        return {
            store,
            creating,
            nameInput,
            categories,
            categoriesAvailable,
            selectedCategoryId,
            handleSubmit
        };
    }
};