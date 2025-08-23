// components/Flashcards/FlashcardCreator.js - Create and Edit Flashcards (Simplified)
window.FlashcardCreatorComponent = {
    template: `
    <div class="animate-fade-in max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">✏️ {{ selectedSet?.name || 'Create Flashcards' }}</h1>
                    <p class="text-gray-600">Add new flashcards to your set</p>
                </div>
                <button 
                    @click="exitCreator"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <i class="fas fa-times mr-2"></i>Done
                </button>
            </div>
        </div>

        <!-- Single Card Creation Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Creation Form -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Create New Card</h2>
                
                <form @submit.prevent="createCard" class="space-y-4">
                    <!-- Front (Question) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Front (Question/Term) *
                        </label>
                        <textarea
                            v-model="newCard.front"
                            placeholder="Enter the question or term..."
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows="3"
                            required
                        ></textarea>
                    </div>

                    <!-- Back (Answer) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Back (Answer/Definition) *
                        </label>
                        <textarea
                            v-model="newCard.back"
                            placeholder="Enter the answer or definition..."
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows="3"
                            required
                        ></textarea>
                    </div>

                    <!-- Hint (Optional) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Hint (Optional)
                        </label>
                        <input
                            v-model="newCard.hint"
                            type="text"
                            placeholder="Optional hint to help recall the answer..."
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-4">
                        <button
                            type="submit"
                            :disabled="createLoading || !newCard.front.trim() || !newCard.back.trim()"
                            class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            <i v-if="createLoading" class="fas fa-spinner fa-spin mr-2"></i>
                            <i v-else class="fas fa-plus mr-2"></i>
                            {{ createLoading ? 'Creating...' : 'Create Card' }}
                        </button>
                        <button
                            type="button"
                            @click="clearForm"
                            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            <!-- Preview -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
                
                <div class="space-y-4">
                    <!-- Front Preview -->
                    <div 
                        class="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-6 min-h-[120px] cursor-pointer"
                        :class="{ 'opacity-50': !newCard.front.trim() }"
                        @click="showSide = 'front'"
                    >
                        <div class="text-center">
                            <div class="text-sm text-blue-600 font-medium mb-2">Front</div>
                            <div class="text-gray-900">{{ newCard.front || 'Your question will appear here...' }}</div>
                            <div v-if="newCard.hint" class="text-sm text-blue-600 italic mt-2">
                                💡 {{ newCard.hint }}
                            </div>
                        </div>
                    </div>

                    <!-- Back Preview -->
                    <div 
                        class="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 min-h-[120px] cursor-pointer"
                        :class="{ 'opacity-50': !newCard.back.trim() }"
                        @click="showSide = 'back'"
                    >
                        <div class="text-center">
                            <div class="text-sm text-green-600 font-medium mb-2">Back</div>
                            <div class="text-gray-900">{{ newCard.back || 'Your answer will appear here...' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cards Created Counter -->
        <div v-if="cardsCreated > 0" class="mt-6 text-center">
            <div class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <i class="fas fa-check-circle mr-2"></i>
                {{ cardsCreated }} card{{ cardsCreated === 1 ? '' : 's' }} created successfully!
            </div>
        </div>

        <!-- Quick Tips -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 class="font-semibold text-blue-800 mb-2">💡 Quick Tips:</h3>
            <ul class="text-sm text-blue-700 space-y-1">
                <li>• Keep questions clear and specific</li>
                <li>• Use hints for challenging concepts</li>
                <li>• Create 10-20 cards per study session</li>
                <li>• Mix different types of questions</li>
            </ul>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // State
        const createLoading = Vue.ref(false);
        const cardsCreated = Vue.ref(0);
        const showSide = Vue.ref('front');
        
        // Form state
        const newCard = Vue.ref({
            front: '',
            back: '',
            hint: ''
        });

        // Computed
        const selectedSet = Vue.computed(() => store?.state?.selectedFlashcardSet);

        // Clear form
        const clearForm = () => {
            newCard.value = {
                front: '',
                back: '',
                hint: ''
            };
        };

        // Create single card
        const createCard = async () => {
            if (!selectedSet.value || createLoading.value) return;
            
            try {
                createLoading.value = true;
                
                const cardData = {
                    front: newCard.value.front.trim(),
                    back: newCard.value.back.trim(),
                    hint: newCard.value.hint.trim() || undefined,
                    difficulty: 2,
                    tags: []
                };
                
                await window.api.post(
                    \`/flashcards/sets/\${selectedSet.value.id}/cards\`,
                    cardData
                );
                
                // Increment counter
                cardsCreated.value++;
                
                // Clear form
                clearForm();
                
                if (store?.showNotification) {
                    store.showNotification('Flashcard created successfully!', 'success');
                }
                
            } catch (error) {
                console.error('❌ Error creating flashcard:', error);
                if (store?.showNotification) {
                    store.showNotification('Failed to create flashcard', 'error');
                }
            } finally {
                createLoading.value = false;
            }
        };

        // Navigation
        const exitCreator = () => {
            if (store?.setCurrentView) {
                store.setCurrentView('flashcards');
            }
        };

        // Lifecycle
        Vue.onMounted(() => {
            if (!selectedSet.value) {
                if (store?.showNotification) {
                    store.showNotification('No flashcard set selected', 'error');
                }
                if (store?.setCurrentView) {
                    store.setCurrentView('flashcards');
                }
                return;
            }
            
            console.log('✅ Flashcard creator loaded for set:', selectedSet.value.name);
        });

        return {
            // State
            createLoading,
            cardsCreated,
            showSide,
            newCard,
            
            // Computed
            selectedSet,
            
            // Methods
            clearForm,
            createCard,
            exitCreator
        };
    }
};