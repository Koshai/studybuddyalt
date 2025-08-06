// components/Views/NotesView.js - Complete Notes Management View
window.NotesViewComponent = {
    template: `
    <div class="space-y-8">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-file-text mr-3 text-purple-600"></i>
                        Study Materials
                    </h1>
                    <p class="text-gray-600 mt-1">Manage your notes, create new content, and organize your study materials</p>
                </div>
                <div class="flex items-center space-x-3">
                    <!-- View Toggle -->
                    <div class="bg-gray-100 rounded-lg p-1 flex">
                        <button
                            @click="currentView = 'all'"
                            :class="[
                                'px-3 py-1 rounded text-sm font-medium transition-colors',
                                currentView === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            ]"
                        >
                            All Notes
                        </button>
                        <button
                            @click="currentView = 'create'"
                            :class="[
                                'px-3 py-1 rounded text-sm font-medium transition-colors',
                                currentView === 'create' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            ]"
                        >
                            Create Note
                        </button>
                    </div>
                    
                    <!-- Upload Button -->
                    <button
                        @click="goToUpload"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <i class="fas fa-upload"></i>
                        <span>Upload Files</span>
                    </button>
                </div>
            </div>

            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-purple-600 font-medium">Total Notes</p>
                            <p class="text-2xl font-bold text-purple-800">{{ allNotes.length }}</p>
                        </div>
                        <i class="fas fa-file-text text-purple-400 text-xl"></i>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-blue-600 font-medium">Total Words</p>
                            <p class="text-2xl font-bold text-blue-800">{{ totalWordCount.toLocaleString() }}</p>
                        </div>
                        <i class="fas fa-font text-blue-400 text-xl"></i>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-green-600 font-medium">Manual Notes</p>
                            <p class="text-2xl font-bold text-green-800">{{ manualNotesCount }}</p>
                        </div>
                        <i class="fas fa-pen text-green-400 text-xl"></i>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-orange-600 font-medium">From Files</p>
                            <p class="text-2xl font-bold text-orange-800">{{ uploadedNotesCount }}</p>
                        </div>
                        <i class="fas fa-upload text-orange-400 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div v-if="currentView === 'all'" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
                <!-- Search -->
                <div class="flex-1">
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search your notes..."
                            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>
                
                <!-- Subject Filter -->
                <div class="md:w-48">
                    <select
                        v-model="selectedSubjectFilter"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">All Subjects</option>
                        <option v-for="subject in store.state.subjects" :key="subject.id" :value="subject.id">
                            {{ subject.name }}
                        </option>
                    </select>
                </div>
                
                <!-- Topic Filter -->
                <div class="md:w-48">
                    <select
                        v-model="selectedTopicFilter"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">All Topics</option>
                        <option v-for="topic in filteredTopics" :key="topic.id" :value="topic.id">
                            {{ topic.name }}
                        </option>
                    </select>
                </div>
                
                <!-- Clear Filters -->
                <button
                    v-if="hasActiveFilters"
                    @click="clearFilters"
                    class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Clear Filters
                </button>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Notes Display (All Notes View) -->
            <div v-if="currentView === 'all'" class="lg:col-span-3">
                <NotesDisplayComponent
                    :key="notesRefreshKey"
                    :notes="filteredNotes"
                    @edit-note="openNoteEditor"
                    @upload="goToUpload"
                    @questions-generated="handleQuestionsGenerated"
                />
            </div>

            <!-- Create Note View -->
            <div v-if="currentView === 'create'" class="lg:col-span-2">
                <QuickNoteCreatorComponent
                    @note-created="handleNoteCreated"
                    @open-advanced-editor="openAdvancedEditor"
                />
            </div>

            <!-- Recent Activity Sidebar (Create View) -->
            <div v-if="currentView === 'create'" class="lg:col-span-1">
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <i class="fas fa-history mr-2 text-gray-600"></i>
                        Recent Notes
                    </h3>
                    
                    <div v-if="recentNotes.length === 0" class="text-center py-8">
                        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-file-text text-gray-400"></i>
                        </div>
                        <p class="text-gray-600 text-sm">No notes created yet</p>
                    </div>
                    
                    <div v-else class="space-y-3">
                        <div
                            v-for="note in recentNotes.slice(0, 5)"
                            :key="note.id"
                            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            @click="openNoteEditor(note)"
                        >
                            <div class="flex items-start space-x-3">
                                <i :class="getFileIcon(note.file_name)" class="text-purple-600 mt-1"></i>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-medium text-gray-900 truncate">
                                        {{ getFileName(note.file_name) }}
                                    </h4>
                                    <p class="text-xs text-gray-500 mt-1">
                                        {{ formatDate(note.created_at) }}
                                    </p>
                                    <p class="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {{ getPlainText(note.content).substring(0, 80) }}...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Note Editor Modal -->
        <NoteEditorModalComponent
            :show="showNoteEditor"
            :note="selectedNote"
            @close="closeNoteEditor"
            @note-saved="handleNoteSaved"
        />
    </div>
    `,

    setup() {
        const store = window.store;
        const currentView = Vue.ref('all');
        const loading = Vue.ref(false);
        const searchQuery = Vue.ref('');
        const selectedSubjectFilter = Vue.ref('');
        const selectedTopicFilter = Vue.ref('');
        const allTopics = Vue.ref([]);
        
        // Note editor state
        const showNoteEditor = Vue.ref(false);
        const selectedNote = Vue.ref(null);

        // Simple refresh trigger - force child component to reload
        const notesRefreshKey = Vue.ref(0);
        
        const loadAllNotes = async () => {
            loading.value = true;
            try {
                // Force NotesDisplay component to refresh by changing its key
                notesRefreshKey.value++;
                console.log('📋 Notes refresh triggered');
            } catch (error) {
                console.error('Failed to trigger notes refresh:', error);
            } finally {
                loading.value = false;
            }
        };

        // Load all topics for filtering
        const loadAllTopics = async () => {
            try {
                allTopics.value = [];
                for (const subject of store.state.subjects) {
                    const topics = await window.api.getTopics(subject.id);
                    allTopics.value.push(...topics);
                }
            } catch (error) {
                console.error('Failed to load topics:', error);
            }
        };

        // Computed properties
        const filteredTopics = Vue.computed(() => {
            if (!selectedSubjectFilter.value) return allTopics.value;
            return allTopics.value.filter(topic => topic.subject_id === selectedSubjectFilter.value);
        });

        // Reactive reference to store notes with forced updates
        const allNotes = Vue.computed(() => {
            // Access dataVersion to ensure reactivity when store updates
            store.state.dataVersion;
            return store.getAllNotes();
        });

        const filteredNotes = Vue.computed(() => {
            let notes = [...allNotes.value];

            // Search filter
            if (searchQuery.value.trim()) {
                const query = searchQuery.value.toLowerCase();
                notes = notes.filter(note => 
                    note.content.toLowerCase().includes(query) ||
                    (note.file_name && note.file_name.toLowerCase().includes(query))
                );
            }

            // Subject filter
            if (selectedSubjectFilter.value) {
                notes = notes.filter(note => note.subject_id === selectedSubjectFilter.value);
            }

            // Topic filter
            if (selectedTopicFilter.value) {
                notes = notes.filter(note => note.topic_id === selectedTopicFilter.value);
            }

            return notes;
        });

        const recentNotes = Vue.computed(() => {
            return [...allNotes.value]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });

        const totalWordCount = Vue.computed(() => {
            return allNotes.value.reduce((total, note) => {
                const plainText = getPlainText(note.content);
                return total + plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
            }, 0);
        });

        const manualNotesCount = Vue.computed(() => {
            return allNotes.value.filter(note => 
                !note.file_name || 
                note.file_name.endsWith('.html') || 
                note.file_name.endsWith('.txt')
            ).length;
        });

        const uploadedNotesCount = Vue.computed(() => {
            return allNotes.value.filter(note => 
                note.file_name && 
                !note.file_name.endsWith('.html') && 
                !note.file_name.endsWith('.txt')
            ).length;
        });

        const hasActiveFilters = Vue.computed(() => {
            return searchQuery.value.trim() || selectedSubjectFilter.value || selectedTopicFilter.value;
        });

        // Methods
        const clearFilters = () => {
            searchQuery.value = '';
            selectedSubjectFilter.value = '';
            selectedTopicFilter.value = '';
        };

        const goToUpload = () => {
            store.setCurrentView('upload');
        };

        const openNoteEditor = (note = null) => {
            selectedNote.value = note;
            showNoteEditor.value = true;
        };

        const closeNoteEditor = () => {
            showNoteEditor.value = false;
            selectedNote.value = null;
        };

        const openAdvancedEditor = () => {
            openNoteEditor(null);
        };

        const handleNoteCreated = () => {
            // No need to reload - store already updated by centralized methods
            console.log('✅ Note created - UI will update automatically');
        };

        const handleNoteSaved = () => {
            console.log('✅ Note saved - refreshing notes');
            closeNoteEditor();
            // Trigger refresh of NotesDisplay component
            notesRefreshKey.value++;
        };

        const handleQuestionsGenerated = (questions) => {
            store.showNotification(`Generated ${questions.length} questions!`, 'success');
        };

        // Helper functions
        const getFileIcon = (fileName) => {
            if (!fileName) return 'fas fa-sticky-note';
            const ext = fileName.split('.').pop()?.toLowerCase();
            const iconMap = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'txt': 'fas fa-sticky-note',
                'html': 'fas fa-code',
                'jpg': 'fas fa-image',
                'jpeg': 'fas fa-image',
                'png': 'fas fa-image',
                'gif': 'fas fa-image'
            };
            return iconMap[ext] || 'fas fa-file';
        };

        const getFileName = (filePath) => {
            if (!filePath) return 'Untitled Note';
            return filePath.split('/').pop()?.replace(/\.[^/.]+$/, "") || filePath;
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                return new Date(dateString).toLocaleDateString();
            } catch (error) {
                return 'Invalid date';
            }
        };

        const getPlainText = (htmlContent) => {
            if (!htmlContent) return '';
            // Simple HTML to text conversion
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            return tempDiv.textContent || tempDiv.innerText || '';
        };

        // Load data on mount
        Vue.onMounted(async () => {
            await loadAllNotes();
            await loadAllTopics();
        });

        return {
            store,
            currentView,
            allNotes,
            loading,
            searchQuery,
            selectedSubjectFilter,
            selectedTopicFilter,
            filteredTopics,
            filteredNotes,
            recentNotes,
            totalWordCount,
            manualNotesCount,
            uploadedNotesCount,
            hasActiveFilters,
            showNoteEditor,
            selectedNote,
            notesRefreshKey,
            clearFilters,
            goToUpload,
            openNoteEditor,
            closeNoteEditor,
            openAdvancedEditor,
            handleNoteCreated,
            handleNoteSaved,
            handleQuestionsGenerated,
            getFileIcon,
            getFileName,
            formatDate,
            getPlainText
        };
    }
};