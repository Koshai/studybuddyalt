// components/Flashcards/FlashcardSetList.js - Browse Flashcard Sets
window.FlashcardSetListComponent = {
    template: `
    <div class="animate-fade-in">
        <!-- Debug Info -->
        <div class="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg mb-4">
            <h3 class="font-bold">🎉 Flashcard System Loaded Successfully!</h3>
            <p class="text-sm">You're seeing the flashcard component. The system is working!</p>
        </div>
        
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">📚 Your Flashcard Sets</h1>
                    <p class="text-gray-600">Create and study with spaced repetition</p>
                </div>
                <button 
                    @click="showCreateSetModal = true"
                    class="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                    <i class="fas fa-plus mr-2"></i>Create Set
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
            <SkeletonLoader type="list" :items="3" />
        </div>

        <!-- Empty State -->
        <div v-else-if="flashcardSets.length === 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-cards-blank text-blue-500 text-3xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Flashcard Sets Yet</h3>
            <p class="text-gray-600 mb-6">Create your first flashcard set to start learning with spaced repetition</p>
            <button 
                @click="showCreateSetModal = true"
                class="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
                <i class="fas fa-plus mr-2"></i>Create Your First Set
            </button>
        </div>

        <!-- Flashcard Sets Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div 
                v-for="set in flashcardSets" 
                :key="set.id"
                @click="openSet(set)"
                class="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1"
            >
                <!-- Set Header -->
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                            {{ set.name }}
                        </h3>
                        <p v-if="set.description" class="text-sm text-gray-600 mt-1 line-clamp-2">
                            {{ set.description }}
                        </p>
                    </div>
                    
                    <!-- Actions Menu -->
                    <div class="relative ml-3" @click.stop>
                        <button 
                            @click="toggleSetMenu(set.id)"
                            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div v-if="activeMenu === set.id" 
                             class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                            <button @click="editSet(set)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-edit mr-2"></i>Edit Set
                            </button>
                            <button @click="duplicateSet(set)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-copy mr-2"></i>Duplicate
                            </button>
                            <button @click="shareSet(set)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-share mr-2"></i>Share
                            </button>
                            <hr class="my-1">
                            <button @click="deleteSet(set)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Set Stats -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                        <div class="text-xl font-bold text-blue-600">{{ set.card_count || 0 }}</div>
                        <div class="text-xs text-blue-700">Cards</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                        <div class="text-xl font-bold text-green-600">{{ Math.round((set.avg_mastery || 0) * 50) }}%</div>
                        <div class="text-xs text-green-700">Mastery</div>
                    </div>
                </div>

                <!-- Study Button -->
                <div class="flex gap-2">
                    <button 
                        @click.stop="studySet(set)"
                        :disabled="!set.card_count"
                        class="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        <i class="fas fa-play mr-2"></i>Study
                    </button>
                    <button 
                        @click.stop="addCards(set)"
                        class="px-4 py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <!-- Last Studied -->
                <div v-if="set.last_studied" class="text-xs text-gray-500 mt-2 text-center">
                    Last studied {{ formatDate(set.last_studied) }}
                </div>
            </div>
        </div>

        <!-- Create Set Modal -->
        <ModalBase 
            :show="showCreateSetModal"
            title="Create Flashcard Set"
            @close="showCreateSetModal = false"
        >
            <form @submit.prevent="createSet" class="space-y-4">
                <!-- Set Name -->
                <ValidatedInput
                    v-model="newSet.name"
                    label="Set Name"
                    placeholder="e.g., Spanish Vocabulary, Biology Chapter 5"
                    :validator="validateSetName"
                    :required="true"
                />

                <!-- Description -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                        v-model="newSet.description"
                        placeholder="Brief description of this flashcard set"
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows="3"
                    ></textarea>
                </div>

                <!-- Link to Topic -->
                <div v-if="availableTopics.length > 0">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Link to Topic (Optional)</label>
                    <select 
                        v-model="newSet.topicId"
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">Select a topic...</option>
                        <option 
                            v-for="topic in availableTopics" 
                            :key="topic.id" 
                            :value="topic.id"
                        >
                            {{ getSubjectName(topic.subject_id) }} - {{ topic.name }}
                        </option>
                    </select>
                </div>

                <!-- Share Setting -->
                <div class="flex items-center">
                    <input
                        v-model="newSet.isShared"
                        type="checkbox"
                        class="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                        Make this set available to other users
                    </label>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-4">
                    <button
                        type="submit"
                        :disabled="createLoading || !newSet.name.trim()"
                        class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        <i v-if="createLoading" class="fas fa-spinner fa-spin mr-2"></i>
                        <i v-else class="fas fa-plus mr-2"></i>
                        {{ createLoading ? 'Creating...' : 'Create Set' }}
                    </button>
                    <button
                        type="button"
                        @click="showCreateSetModal = false"
                        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </ModalBase>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // State
        const loading = Vue.ref(true);
        const flashcardSets = Vue.ref([]);
        const showCreateSetModal = Vue.ref(false);
        const createLoading = Vue.ref(false);
        const activeMenu = Vue.ref(null);
        const availableTopics = Vue.ref([]);
        
        // New set form
        const newSet = Vue.ref({
            name: '',
            description: '',
            topicId: '',
            isShared: false
        });

        // Load flashcard sets
        const loadFlashcardSets = async () => {
            try {
                loading.value = true;
                const response = await window.api.get('/api/flashcards/sets');
                flashcardSets.value = response.data || [];
                console.log(`✅ Loaded ${flashcardSets.value.length} flashcard sets`);
            } catch (error) {
                console.error('❌ Error loading flashcard sets:', error);
                store.showNotification('Failed to load flashcard sets', 'error');
            } finally {
                loading.value = false;
            }
        };

        // Load available topics for linking
        const loadAvailableTopics = async () => {
            try {
                // Get all subjects first
                const subjects = store.state.subjects || [];
                let allTopics = [];
                
                for (const subject of subjects) {
                    try {
                        const topics = await window.api.getTopics(subject.id);
                        allTopics.push(...topics);
                    } catch (error) {
                        console.warn(`Failed to load topics for subject ${subject.name}:`, error);
                    }
                }
                
                availableTopics.value = allTopics;
            } catch (error) {
                console.error('❌ Error loading topics:', error);
            }
        };

        // Validation
        const validateSetName = (name) => {
            if (!name.trim()) {
                return { isValid: false, errors: ['Set name is required'] };
            }
            if (name.length < 2) {
                return { isValid: false, errors: ['Set name must be at least 2 characters'] };
            }
            if (name.length > 100) {
                return { isValid: false, errors: ['Set name must be less than 100 characters'] };
            }
            return { isValid: true, errors: [] };
        };

        // Create new flashcard set
        const createSet = async () => {
            if (!newSet.value.name.trim() || createLoading.value) return;
            
            try {
                createLoading.value = true;
                
                const setData = {
                    name: newSet.value.name.trim(),
                    description: newSet.value.description.trim(),
                    topicId: newSet.value.topicId || null,
                    isShared: newSet.value.isShared
                };
                
                const response = await window.api.post('/api/flashcards/sets', setData);
                
                // Add to local list
                flashcardSets.value.unshift({
                    ...response.data,
                    card_count: 0,
                    avg_mastery: 0
                });
                
                // Reset form and close modal
                newSet.value = { name: '', description: '', topicId: '', isShared: false };
                showCreateSetModal.value = false;
                
                store.showNotification('Flashcard set created successfully!', 'success');
                
            } catch (error) {
                console.error('❌ Error creating flashcard set:', error);
                store.showNotification('Failed to create flashcard set', 'error');
            } finally {
                createLoading.value = false;
            }
        };

        // Set actions
        const openSet = (set) => {
            console.log('🔍 Opening flashcard set:', set.name);
            // Navigate to flashcard set detail/study view
            store.state.selectedFlashcardSet = set;
            store.setCurrentView('flashcards-study');
        };

        const studySet = (set) => {
            if (!set.card_count) {
                store.showNotification('This set has no cards to study', 'warning');
                return;
            }
            console.log('📚 Starting study session for:', set.name);
            store.state.selectedFlashcardSet = set;
            store.setCurrentView('flashcards-study');
        };

        const addCards = (set) => {
            console.log('➕ Adding cards to:', set.name);
            store.state.selectedFlashcardSet = set;
            store.setCurrentView('flashcards-create');
        };

        const editSet = (set) => {
            console.log('✏️ Editing set:', set.name);
            // TODO: Implement edit functionality
            store.showNotification('Set editing coming soon!', 'info');
        };

        const duplicateSet = (set) => {
            console.log('📋 Duplicating set:', set.name);
            // TODO: Implement duplicate functionality
            store.showNotification('Set duplication coming soon!', 'info');
        };

        const shareSet = (set) => {
            console.log('🔗 Sharing set:', set.name);
            // TODO: Implement sharing functionality
            store.showNotification('Set sharing coming soon!', 'info');
        };

        const deleteSet = async (set) => {
            if (!confirm(\`Are you sure you want to delete "\${set.name}"? This action cannot be undone.\`)) {
                return;
            }
            
            try {
                await window.api.delete(\`/api/flashcards/sets/\${set.id}\`);
                
                // Remove from local list
                const index = flashcardSets.value.findIndex(s => s.id === set.id);
                if (index > -1) {
                    flashcardSets.value.splice(index, 1);
                }
                
                store.showNotification('Flashcard set deleted successfully', 'success');
                
            } catch (error) {
                console.error('❌ Error deleting flashcard set:', error);
                store.showNotification('Failed to delete flashcard set', 'error');
            } finally {
                activeMenu.value = null;
            }
        };

        const toggleSetMenu = (setId) => {
            activeMenu.value = activeMenu.value === setId ? null : setId;
        };

        // Utility functions
        const getSubjectName = (subjectId) => {
            const subject = store.getSubjectById?.(subjectId);
            return subject ? subject.name : 'Unknown Subject';
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'Never';
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return \`\${diffDays} days ago\`;
            return date.toLocaleDateString();
        };

        // Close menus when clicking outside
        const handleClickOutside = () => {
            activeMenu.value = null;
        };

        // Lifecycle
        Vue.onMounted(() => {
            loadFlashcardSets();
            loadAvailableTopics();
            document.addEventListener('click', handleClickOutside);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
        });

        return {
            // State
            loading,
            flashcardSets,
            showCreateSetModal,
            createLoading,
            activeMenu,
            availableTopics,
            newSet,
            
            // Methods
            createSet,
            openSet,
            studySet,
            addCards,
            editSet,
            duplicateSet,
            shareSet,
            deleteSet,
            toggleSetMenu,
            validateSetName,
            getSubjectName,
            formatDate
        };
    }
};