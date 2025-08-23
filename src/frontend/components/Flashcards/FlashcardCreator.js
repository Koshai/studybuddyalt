// components/Flashcards/FlashcardCreator.js - Create and Edit Flashcards
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
                <div class="flex gap-3">
                    <button 
                        @click="bulkCreateMode = !bulkCreateMode"
                        class="px-4 py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                        <i class="fas fa-list mr-2"></i>{{ bulkCreateMode ? 'Single Mode' : 'Bulk Mode' }}
                    </button>
                    <button 
                        @click="exitCreator"
                        class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <i class="fas fa-times mr-2"></i>Done
                    </button>
                </div>
            </div>
        </div>

        <!-- Single Card Creation Mode -->
        <div v-if="!bulkCreateMode" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            rows="3"
                            maxlength="1000"
                            required
                        ></textarea>
                        <div class="text-xs text-gray-500 mt-1">{{ newCard.front.length }}/1000</div>
                    </div>

                    <!-- Back (Answer) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Back (Answer/Definition) *
                        </label>
                        <textarea
                            v-model="newCard.back"
                            placeholder="Enter the answer or definition..."
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            rows="3"
                            maxlength="2000"
                            required
                        ></textarea>
                        <div class="text-xs text-gray-500 mt-1">{{ newCard.back.length }}/2000</div>
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
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            maxlength="500"
                        />
                    </div>

                    <!-- Difficulty -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                        <select 
                            v-model="newCard.difficulty"
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option :value="1">Easy</option>
                            <option :value="2">Medium</option>
                            <option :value="3">Hard</option>
                        </select>
                    </div>

                    <!-- Tags -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span 
                                v-for="(tag, index) in newCard.tags" 
                                :key="index"
                                class="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                            >
                                {{ tag }}
                                <button 
                                    @click="removeTag(index)" 
                                    class="ml-1 text-primary-500 hover:text-primary-700"
                                >
                                    <i class="fas fa-times text-xs"></i>
                                </button>
                            </span>
                        </div>
                        <input
                            v-model="newTag"
                            @keyup.enter="addTag"
                            type="text"
                            placeholder="Add a tag and press Enter..."
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-4">
                        <button
                            type="submit"
                            :disabled="createLoading || !newCard.front.trim() || !newCard.back.trim()"
                            class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                        class="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 min-h-[120px]"
                        :class="{ 'opacity-50': !newCard.back.trim() }"
                    >
                        <div class="text-center">
                            <div class="text-sm text-green-600 font-medium mb-2">Back</div>
                            <div class="text-gray-900">{{ newCard.back || 'Your answer will appear here...' }}</div>
                        </div>
                    </div>

                    <!-- Card Info -->
                    <div class="text-sm text-gray-600 space-y-1">
                        <div><strong>Difficulty:</strong> {{ ['', 'Easy', 'Medium', 'Hard'][newCard.difficulty] }}</div>
                        <div v-if="newCard.tags.length > 0">
                            <strong>Tags:</strong> {{ newCard.tags.join(', ') }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bulk Creation Mode -->
        <div v-else class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold text-gray-900">Bulk Create Cards</h2>
                <div class="text-sm text-gray-600">
                    Use format: Front | Back | Hint (optional)
                </div>
            </div>

            <div class="space-y-4">
                <textarea
                    v-model="bulkText"
                    placeholder="Enter cards in this format (one per line):
What is the capital of France? | Paris | It's the city of light
Who wrote Romeo and Juliet? | William Shakespeare
What is 2+2? | 4"
                    class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                    rows="12"
                ></textarea>

                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600">
                        {{ parsedBulkCards.length }} cards will be created
                    </div>
                    <div class="flex gap-3">
                        <button
                            @click="bulkText = ''"
                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            @click="createBulkCards"
                            :disabled="bulkCreateLoading || parsedBulkCards.length === 0"
                            class="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            <i v-if="bulkCreateLoading" class="fas fa-spinner fa-spin mr-2"></i>
                            <i v-else class="fas fa-upload mr-2"></i>
                            {{ bulkCreateLoading ? 'Creating...' : \`Create \${parsedBulkCards.length} Cards\` }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Preview of bulk cards -->
            <div v-if="parsedBulkCards.length > 0" class="mt-6">
                <h3 class="text-md font-medium text-gray-900 mb-3">Preview (first 3 cards)</h3>
                <div class="space-y-2">
                    <div 
                        v-for="(card, index) in parsedBulkCards.slice(0, 3)" 
                        :key="index"
                        class="p-3 border border-gray-200 rounded-lg text-sm"
                    >
                        <div><strong>Front:</strong> {{ card.front }}</div>
                        <div><strong>Back:</strong> {{ card.back }}</div>
                        <div v-if="card.hint"><strong>Hint:</strong> {{ card.hint }}</div>
                    </div>
                    <div v-if="parsedBulkCards.length > 3" class="text-sm text-gray-500 text-center">
                        ... and {{ parsedBulkCards.length - 3 }} more cards
                    </div>
                </div>
            </div>
        </div>

        <!-- Existing Cards (if any) -->
        <div v-if="existingCards.length > 0" class="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">Existing Cards ({{ existingCards.length }})</h2>
                <button 
                    @click="showExisting = !showExisting"
                    class="text-primary-600 hover:text-primary-700"
                >
                    {{ showExisting ? 'Hide' : 'Show' }}
                </button>
            </div>
            
            <div v-if="showExisting" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div 
                    v-for="card in existingCards.slice(0, showAllExisting ? existingCards.length : 6)" 
                    :key="card.id"
                    class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div class="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{{ card.front }}</div>
                    <div class="text-sm text-gray-600 line-clamp-2">{{ card.back }}</div>
                    <div class="flex items-center justify-between mt-3">
                        <span class="text-xs text-gray-500">
                            {{ ['', 'Easy', 'Medium', 'Hard'][card.difficulty] }}
                        </span>
                        <div class="flex gap-1">
                            <button 
                                @click="editCard(card)"
                                class="text-blue-600 hover:text-blue-700 text-sm"
                            >
                                <i class="fas fa-edit"></i>
                            </button>
                            <button 
                                @click="deleteCard(card)"
                                class="text-red-600 hover:text-red-700 text-sm"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div v-if="existingCards.length > 6 && !showAllExisting" 
                     class="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <button 
                        @click="showAllExisting = true"
                        class="text-primary-600 hover:text-primary-700"
                    >
                        Show {{ existingCards.length - 6 }} more cards
                    </button>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // State
        const createLoading = Vue.ref(false);
        const bulkCreateLoading = Vue.ref(false);
        const bulkCreateMode = Vue.ref(false);
        const showExisting = Vue.ref(false);
        const showAllExisting = Vue.ref(false);
        const existingCards = Vue.ref([]);
        
        // Form state
        const newCard = Vue.ref({
            front: '',
            back: '',
            hint: '',
            difficulty: 2,
            tags: []
        });
        const newTag = Vue.ref('');
        const bulkText = Vue.ref('');

        // Computed
        const selectedSet = Vue.computed(() => store.state.selectedFlashcardSet);
        
        const parsedBulkCards = Vue.computed(() => {
            if (!bulkText.value.trim()) return [];
            
            return bulkText.value
                .split('\\n')
                .filter(line => line.trim())
                .map(line => {
                    const parts = line.split('|').map(p => p.trim());
                    return {
                        front: parts[0] || '',
                        back: parts[1] || '',
                        hint: parts[2] || '',
                        difficulty: 2,
                        tags: []
                    };
                })
                .filter(card => card.front && card.back);
        });

        // Load existing cards
        const loadExistingCards = async () => {
            if (!selectedSet.value) return;
            
            try {
                const response = await window.api.get(\`/api/flashcards/sets/\${selectedSet.value.id}/cards\`);
                existingCards.value = response.data || [];
                console.log(\`✅ Loaded \${existingCards.value.length} existing cards\`);
            } catch (error) {
                console.error('❌ Error loading existing cards:', error);
            }
        };

        // Form methods
        const addTag = () => {
            const tag = newTag.value.trim();
            if (tag && !newCard.value.tags.includes(tag) && newCard.value.tags.length < 10) {
                newCard.value.tags.push(tag);
                newTag.value = '';
            }
        };

        const removeTag = (index) => {
            newCard.value.tags.splice(index, 1);
        };

        const clearForm = () => {
            newCard.value = {
                front: '',
                back: '',
                hint: '',
                difficulty: 2,
                tags: []
            };
            newTag.value = '';
        };

        // Create single card
        const createCard = async () => {
            if (!selectedSet.value || createLoading.value) return;
            
            try {
                createLoading.value = true;
                
                const cardData = {
                    front: newCard.value.front.trim(),
                    back: newCard.value.back.trim(),
                    hint: newCard.value.hint.trim(),
                    difficulty: newCard.value.difficulty,
                    tags: newCard.value.tags
                };
                
                const response = await window.api.post(
                    \`/api/flashcards/sets/\${selectedSet.value.id}/cards\`,
                    cardData
                );
                
                // Add to existing cards list
                existingCards.value.unshift(response.data);
                
                // Clear form
                clearForm();
                
                store.showNotification('Flashcard created successfully!', 'success');
                
            } catch (error) {
                console.error('❌ Error creating flashcard:', error);
                store.showNotification('Failed to create flashcard', 'error');
            } finally {
                createLoading.value = false;
            }
        };

        // Create bulk cards
        const createBulkCards = async () => {
            if (!selectedSet.value || bulkCreateLoading.value || parsedBulkCards.value.length === 0) return;
            
            try {
                bulkCreateLoading.value = true;
                let successCount = 0;
                let errorCount = 0;
                
                for (const cardData of parsedBulkCards.value) {
                    try {
                        const response = await window.api.post(
                            \`/api/flashcards/sets/\${selectedSet.value.id}/cards\`,
                            cardData
                        );
                        existingCards.value.unshift(response.data);
                        successCount++;
                    } catch (error) {
                        console.warn('❌ Failed to create card:', cardData.front, error);
                        errorCount++;
                    }
                }
                
                // Clear bulk text
                bulkText.value = '';
                
                if (successCount > 0) {
                    store.showNotification(\`Created \${successCount} flashcard(s) successfully!\`, 'success');
                }
                if (errorCount > 0) {
                    store.showNotification(\`Failed to create \${errorCount} flashcard(s)\`, 'warning');
                }
                
            } catch (error) {
                console.error('❌ Error creating bulk flashcards:', error);
                store.showNotification('Failed to create flashcards', 'error');
            } finally {
                bulkCreateLoading.value = false;
            }
        };

        // Card management
        const editCard = (card) => {
            console.log('✏️ Editing card:', card.front);
            // TODO: Implement edit functionality
            store.showNotification('Card editing coming soon!', 'info');
        };

        const deleteCard = async (card) => {
            if (!confirm(\`Are you sure you want to delete this flashcard?\\n\\n"\${card.front}"\`)) {
                return;
            }
            
            try {
                await window.api.delete(\`/api/flashcards/cards/\${card.id}\`);
                
                // Remove from existing cards
                const index = existingCards.value.findIndex(c => c.id === card.id);
                if (index > -1) {
                    existingCards.value.splice(index, 1);
                }
                
                store.showNotification('Flashcard deleted successfully', 'success');
                
            } catch (error) {
                console.error('❌ Error deleting flashcard:', error);
                store.showNotification('Failed to delete flashcard', 'error');
            }
        };

        // Navigation
        const exitCreator = () => {
            store.setCurrentView('flashcards');
        };

        // Lifecycle
        Vue.onMounted(() => {
            if (!selectedSet.value) {
                store.showNotification('No flashcard set selected', 'error');
                store.setCurrentView('flashcards');
                return;
            }
            
            loadExistingCards();
        });

        return {
            // State
            createLoading,
            bulkCreateLoading,
            bulkCreateMode,
            showExisting,
            showAllExisting,
            existingCards,
            newCard,
            newTag,
            bulkText,
            
            // Computed
            selectedSet,
            parsedBulkCards,
            
            // Methods
            addTag,
            removeTag,
            clearForm,
            createCard,
            createBulkCards,
            editCard,
            deleteCard,
            exitCreator
        };
    }
};