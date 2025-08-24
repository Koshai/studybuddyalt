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

        <!-- AI Generation Section -->
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg border border-purple-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold text-purple-900 mb-2">🤖 Generate with AI</h2>
                    <p class="text-purple-700 text-sm">Let AI create flashcards from your existing notes</p>
                </div>
                <button 
                    @click="showAIGenerator = !showAIGenerator"
                    class="px-4 py-2 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-100 transition-colors"
                >
                    <i :class="showAIGenerator ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="mr-2"></i>
                    {{ showAIGenerator ? 'Hide' : 'Show' }}
                </button>
            </div>
            
            <div v-if="showAIGenerator" class="space-y-4">
                <!-- Topic Selection -->
                <div>
                    <label class="block text-sm font-medium text-purple-700 mb-2">
                        Select Topic with Notes
                    </label>
                    <select 
                        v-model="selectedTopicForAI"
                        class="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="">Choose a topic...</option>
                        <option v-for="topic in topicsWithNotes" :key="topic.id" :value="topic.id">
                            {{ topic.name }} ({{ topic.notesCount }} notes)
                        </option>
                    </select>
                </div>
                
                <!-- Generation Options -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-purple-700 mb-2">
                            Number of Cards
                        </label>
                        <select 
                            v-model="aiGenerationCount"
                            class="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="3">3 cards</option>
                            <option value="5">5 cards</option>
                            <option value="8">8 cards</option>
                            <option value="10">10 cards</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button
                            @click="generateWithAI"
                            :disabled="aiGenerating || !selectedTopicForAI"
                            class="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            <i v-if="aiGenerating" class="fas fa-spinner fa-spin mr-2"></i>
                            <i v-else class="fas fa-magic mr-2"></i>
                            {{ aiGenerating ? 'Generating...' : 'Generate Cards' }}
                        </button>
                    </div>
                </div>
                
                <!-- Generated Cards Preview -->
                <div v-if="generatedCards.length > 0" class="mt-6">
                    <h3 class="text-md font-semibold text-purple-900 mb-3">Generated Cards (Review & Add)</h3>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        <div 
                            v-for="(card, index) in generatedCards" 
                            :key="index"
                            class="bg-white rounded-lg border border-purple-200 p-4"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <p class="font-medium text-gray-900 mb-1">Q: {{ card.front }}</p>
                                    <p class="text-gray-700 mb-1">A: {{ card.back }}</p>
                                    <p v-if="card.hint" class="text-sm text-gray-600 italic">💡 {{ card.hint }}</p>
                                </div>
                                <div class="flex gap-2 ml-4">
                                    <button
                                        @click="addGeneratedCard(card)"
                                        class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                                    >
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                    <button
                                        @click="removeGeneratedCard(index)"
                                        class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-4">
                        <button
                            @click="addAllGeneratedCards"
                            class="flex-1 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                            <i class="fas fa-check-double mr-2"></i>Add All Cards
                        </button>
                        <button
                            @click="clearGeneratedCards"
                            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Single Card Creation Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Creation Form -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Create New Card Manually</h2>
                
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

        // AI Generation state
        const showAIGenerator = Vue.ref(false);
        const aiGenerating = Vue.ref(false);
        const selectedTopicForAI = Vue.ref('');
        const aiGenerationCount = Vue.ref(5);
        const generatedCards = Vue.ref([]);
        const topicsWithNotes = Vue.ref([]);

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
                    `/flashcards/sets/${selectedSet.value.id}/cards`,
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

        // AI Generation methods
        const loadTopicsWithNotes = async () => {
            try {
                console.log('🔍 Loading topics with notes...');
                
                // Get all subjects first
                const subjects = window.api.getSubjects();
                console.log(`🔍 Found ${subjects.length} subjects`);
                
                // Get topics for each subject
                let allTopics = [];
                for (const subject of subjects) {
                    try {
                        const topics = await window.api.getTopics(subject.id);
                        console.log(`🔍 Subject "${subject.name}" has ${topics.length} topics`);
                        allTopics = allTopics.concat(topics);
                    } catch (subjectError) {
                        console.error(`❌ Error loading topics for subject ${subject.name}:`, subjectError);
                    }
                }
                
                console.log(`🔍 Found ${allTopics.length} total topics:`, allTopics);
                
                // Filter topics that have notes
                const topicsWithNotesData = [];
                for (const topic of allTopics) {
                    console.log(`🔍 Checking notes for topic: ${topic.name} (${topic.id})`);
                    try {
                        const notes = await window.api.getNotesByTopicId(topic.id);
                        console.log(`🔍 Topic "${topic.name}" has ${notes.length} notes`);
                        if (notes.length > 0) {
                            topicsWithNotesData.push({
                                ...topic,
                                notesCount: notes.length
                            });
                        }
                    } catch (noteError) {
                        console.error(`❌ Error loading notes for topic ${topic.name}:`, noteError);
                    }
                }
                
                topicsWithNotes.value = topicsWithNotesData;
                console.log(`✅ Found ${topicsWithNotesData.length} topics with notes:`, topicsWithNotesData);
            } catch (error) {
                console.error('❌ Error loading topics with notes:', error);
                if (store?.showNotification) {
                    store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        const generateWithAI = async () => {
            if (!selectedTopicForAI.value || aiGenerating.value) return;
            
            try {
                aiGenerating.value = true;
                console.log(`🤖 Generating ${aiGenerationCount.value} flashcards for topic ${selectedTopicForAI.value}`);
                
                const response = await window.api.post('/flashcards/generate', {
                    topicId: selectedTopicForAI.value,
                    setId: selectedSet.value.id,
                    count: parseInt(aiGenerationCount.value)
                });
                
                generatedCards.value = response.data.cards || [];
                
                if (store?.showNotification) {
                    store.showNotification(
                        `AI generated ${generatedCards.value.length} flashcards from ${response.data.notesUsed} notes!`, 
                        'success'
                    );
                }
                
            } catch (error) {
                console.error('❌ Error generating flashcards:', error);
                if (store?.showNotification) {
                    store.showNotification('Failed to generate flashcards with AI', 'error');
                }
            } finally {
                aiGenerating.value = false;
            }
        };

        const addGeneratedCard = async (card) => {
            try {
                await window.api.post(
                    `/flashcards/sets/${selectedSet.value.id}/cards`,
                    card
                );
                
                cardsCreated.value++;
                
                // Remove from generated cards
                const index = generatedCards.value.findIndex(c => 
                    c.front === card.front && c.back === card.back
                );
                if (index > -1) {
                    generatedCards.value.splice(index, 1);
                }
                
                if (store?.showNotification) {
                    store.showNotification('Card added successfully!', 'success');
                }
                
            } catch (error) {
                console.error('❌ Error adding generated card:', error);
                if (store?.showNotification) {
                    store.showNotification('Failed to add card', 'error');
                }
            }
        };

        const addAllGeneratedCards = async () => {
            const cards = [...generatedCards.value];
            for (const card of cards) {
                await addGeneratedCard(card);
            }
        };

        const removeGeneratedCard = (index) => {
            generatedCards.value.splice(index, 1);
        };

        const clearGeneratedCards = () => {
            generatedCards.value = [];
        };

        // Navigation
        const exitCreator = () => {
            if (store?.setCurrentView) {
                store.setCurrentView('flashcards');
            }
        };

        // Lifecycle
        Vue.onMounted(() => {
            console.log('🔧 FlashcardCreator mounted - Debug info:');
            console.log('  store:', !!store);
            console.log('  store.state:', !!store?.state);
            console.log('  selectedFlashcardSet:', store?.state?.selectedFlashcardSet);
            console.log('  selectedSet.value:', selectedSet.value);
            
            if (!selectedSet.value) {
                console.log('❌ No flashcard set selected, redirecting...');
                if (store?.showNotification) {
                    store.showNotification('No flashcard set selected', 'error');
                }
                if (store?.setCurrentView) {
                    store.setCurrentView('flashcards');
                }
                return;
            }
            
            console.log('✅ Flashcard creator loaded for set:', selectedSet.value.name);
            
            // Load topics with notes for AI generation
            loadTopicsWithNotes();
        });

        return {
            // State
            createLoading,
            cardsCreated,
            showSide,
            newCard,
            
            // AI Generation state
            showAIGenerator,
            aiGenerating,
            selectedTopicForAI,
            aiGenerationCount,
            generatedCards,
            topicsWithNotes,
            
            // Computed
            selectedSet,
            
            // Methods
            clearForm,
            createCard,
            exitCreator,
            
            // AI Generation methods
            generateWithAI,
            addGeneratedCard,
            addAllGeneratedCards,
            removeGeneratedCard,
            clearGeneratedCards
        };
    }
};