// components/Forms/QuickNoteCreator.js - Quick Manual Note Creation
window.QuickNoteCreatorComponent = {
    template: `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900 flex items-center">
                <i class="fas fa-pen mr-3 text-purple-600"></i>
                Quick Note
            </h3>
            <button 
                @click="toggleAdvanced"
                class="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
                {{ showAdvancedEditor ? 'Simple' : 'Advanced' }} Editor
            </button>
        </div>

        <!-- Quick Form for Simple Notes -->
        <div v-if="!showAdvancedEditor" class="space-y-4">
            <!-- Topic Selection -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <select
                    v-model="selectedTopicId"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                >
                    <option value="">Select a topic...</option>
                    <option 
                        v-for="topic in availableTopics" 
                        :key="topic.id" 
                        :value="topic.id"
                    >
                        {{ topic.name }} ({{ getSubjectName(topic.subject_id) }})
                    </option>
                </select>
            </div>

            <!-- Note Title -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Note Title</label>
                <input
                    v-model="noteTitle"
                    type="text"
                    placeholder="Enter note title..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
            </div>

            <!-- Simple Text Area -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
                <textarea
                    v-model="noteContent"
                    rows="6"
                    placeholder="Start writing your note..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                ></textarea>
                <div class="flex items-center justify-between mt-2">
                    <p class="text-sm text-gray-500">{{ wordCount }} words, {{ characterCount }} characters</p>
                    <button
                        @click="showAdvancedEditor = true"
                        class="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Need formatting? Switch to advanced editor
                    </button>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div class="text-sm text-gray-500">
                    Quick note creation
                </div>
                <div class="flex space-x-3">
                    <button
                        @click="clearForm"
                        class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        @click="createQuickNote"
                        :disabled="!canCreateNote || loading"
                        :class="[
                            'px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2',
                            (!canCreateNote || loading) ? 'opacity-50 cursor-not-allowed' : ''
                        ]"
                    >
                        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-plus"></i>
                        <span>Create Note</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Advanced Editor Toggle -->
        <div v-else class="text-center py-8">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-edit text-purple-600 text-2xl"></i>
            </div>
            <h4 class="text-lg font-medium text-gray-900 mb-2">Advanced Editor</h4>
            <p class="text-gray-600 mb-4">Use the rich text editor for formatted notes with styling options</p>
            <button
                @click="openAdvancedEditor"
                class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-external-link-alt mr-2"></i>
                Open Rich Text Editor
            </button>
        </div>

        <!-- Recent Topics (for convenience) -->
        <div v-if="!showAdvancedEditor && recentTopics.length > 0" class="mt-6 pt-4 border-t border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Recent Topics</h4>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="topic in recentTopics.slice(0, 5)"
                    :key="topic.id"
                    @click="selectedTopicId = topic.id"
                    :class="[
                        'px-3 py-1 text-sm rounded-full border transition-colors',
                        selectedTopicId === topic.id 
                            ? 'bg-purple-100 text-purple-700 border-purple-300' 
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    ]"
                >
                    {{ topic.name }}
                </button>
            </div>
        </div>
    </div>
    `,

    setup(props, { emit }) {
        const store = window.store;
        const loading = Vue.ref(false);
        const showAdvancedEditor = Vue.ref(false);
        const selectedTopicId = Vue.ref('');
        const noteTitle = Vue.ref('');
        const noteContent = Vue.ref('');
        const availableTopics = Vue.ref([]);
        const recentTopics = Vue.ref([]);

        // Computed properties
        const wordCount = Vue.computed(() => {
            return noteContent.value.trim().split(/\s+/).filter(word => word.length > 0).length;
        });

        const characterCount = Vue.computed(() => {
            return noteContent.value.length;
        });

        const canCreateNote = Vue.computed(() => {
            return selectedTopicId.value && 
                   noteTitle.value.trim().length > 0 && 
                   noteContent.value.trim().length > 0;
        });

        // Load available topics
        const loadAvailableTopics = async () => {
            try {
                availableTopics.value = [];
                recentTopics.value = [];
                
                for (const subject of store.state.subjects) {
                    const topics = await window.api.getTopics(subject.id);
                    availableTopics.value.push(...topics);
                    
                    // Add recently created topics to recent list
                    const recent = topics
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 3);
                    recentTopics.value.push(...recent);
                }
                
                // Sort recent topics by creation date
                recentTopics.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } catch (error) {
                console.error('Failed to load topics:', error);
                store.showNotification('Failed to load topics', 'error');
            }
        };

        // Create quick note
        const createQuickNote = async () => {
            if (!canCreateNote.value) return;

            loading.value = true;
            try {
                // Convert plain text to HTML with line breaks
                const htmlContent = noteContent.value
                    .replace(/\n\n+/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>');

                const newNoteData = {
                    topicId: selectedTopicId.value,
                    content: htmlContent,
                    fileName: noteTitle.value.trim() + '.txt',
                    title: noteTitle.value.trim()
                };

                await store.createNote(newNoteData);
                
                // Clear form
                clearForm();
                
                // Emit event to parent
                emit('note-created');
                
            } catch (error) {
                console.error('Failed to create note:', error);
                if (error.message.includes('limit')) {
                    store.showNotification('Creation failed: ' + error.message, 'warning');
                } else {
                    store.showNotification('Failed to create note', 'error');
                }
            } finally {
                loading.value = false;
            }
        };

        // Clear form
        const clearForm = () => {
            noteTitle.value = '';
            noteContent.value = '';
            selectedTopicId.value = '';
        };

        // Toggle advanced editor
        const toggleAdvanced = () => {
            showAdvancedEditor.value = !showAdvancedEditor.value;
        };

        // Open advanced editor modal
        const openAdvancedEditor = () => {
            emit('open-advanced-editor');
        };

        // Helper functions
        const getSubjectName = (subjectId) => {
            const subject = store.state.subjects.find(s => s.id === subjectId);
            return subject ? subject.name : 'Unknown Subject';
        };

        // Load topics on mount
        Vue.onMounted(() => {
            loadAvailableTopics();
        });

        // Watch for store changes to reload topics
        Vue.watch(() => store.state.subjects, () => {
            loadAvailableTopics();
        });

        return {
            store,
            loading,
            showAdvancedEditor,
            selectedTopicId,
            noteTitle,
            noteContent,
            availableTopics,
            recentTopics,
            wordCount,
            characterCount,
            canCreateNote,
            createQuickNote,
            clearForm,
            toggleAdvanced,
            openAdvancedEditor,
            getSubjectName
        };
    },

    emits: ['note-created', 'open-advanced-editor']
};