// components/Notes/NotesDisplay.js - Display extracted notes
window.NotesDisplayComponent = {
    template: `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900 flex items-center">
                <i class="fas fa-file-text mr-3 text-purple-600"></i>
                Study Materials
                <span class="ml-3 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{{ notes.length }}</span>
            </h3>
            <button 
                @click="refreshNotes"
                class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
                <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
            <div class="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-4 animate-pulse"></div>
            <p class="text-gray-600">Loading study materials...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="notes.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-file-upload text-gray-400 text-2xl"></i>
            </div>
            <h4 class="text-lg font-medium text-gray-900 mb-2">No Study Materials</h4>
            <p class="text-gray-600 mb-4">Upload documents, images, or PDFs to see extracted content here</p>
            <button 
                @click="$emit('upload')"
                class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-upload mr-2"></i>Upload Materials
            </button>
        </div>

        <!-- Notes List -->
        <div v-else class="space-y-6">
            <div
                v-for="note in notes"
                :key="note.id"
                class="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
                <!-- Note Header -->
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <i :class="getFileIcon(note.file_name)" class="text-white"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900">{{ getFileName(note.file_name) }}</h4>
                                <p class="text-sm text-gray-600">{{ formatDate(note.created_at) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500">{{ getWordCount(note.content) }} words</span>
                            <button 
                                @click="toggleExpanded(note.id)"
                                class="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i :class="expandedNotes.includes(note.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Note Content -->
                <div class="p-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="font-medium text-gray-700">Extracted Text Content</h5>
                            <div class="flex space-x-2">
                                <button 
                                    @click="copyToClipboard(note.content)"
                                    class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                >
                                    <i class="fas fa-copy mr-1"></i>Copy
                                </button>
                                <button 
                                    @click="generateQuestionsFromNote(note)"
                                    class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                >
                                    <i class="fas fa-magic mr-1"></i>Generate Questions
                                </button>
                            </div>
                        </div>
                        
                        <!-- Content Preview/Full -->
                        <div 
                            :class="[
                                'text-sm text-gray-800 whitespace-pre-wrap',
                                expandedNotes.includes(note.id) ? '' : 'max-h-32 overflow-hidden'
                            ]"
                        >
                            {{ expandedNotes.includes(note.id) ? note.content : truncateText(note.content, 300) }}
                        </div>
                        
                        <!-- Read More/Less -->
                        <div v-if="note.content && note.content.length > 300" class="mt-3 pt-3 border-t border-gray-200">
                            <button 
                                @click="toggleExpanded(note.id)"
                                class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                            >
                                {{ expandedNotes.includes(note.id) ? 'Show Less' : 'Read More' }}
                                <i :class="expandedNotes.includes(note.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="ml-1"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Note Metadata -->
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <div class="flex items-center space-x-4">
                                <span class="flex items-center">
                                    <i class="fas fa-folder mr-1"></i>
                                    {{ getSubjectName(note.subject_id) }}
                                </span>
                                <span class="flex items-center">
                                    <i class="fas fa-tag mr-1"></i>
                                    {{ getTopicName(note.topic_id) }}
                                </span>
                            </div>
                            <div class="flex space-x-2">
                                <button 
                                    @click="editNote(note)"
                                    class="text-gray-400 hover:text-blue-500 transition-colors"
                                    title="Edit note"
                                >
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button 
                                    @click="deleteNote(note)"
                                    class="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete note"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination (if many notes) -->
        <div v-if="notes.length > itemsPerPage" class="mt-6 flex justify-center">
            <div class="flex space-x-2">
                <button 
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                <button 
                    @click="currentPage++"
                    :disabled="currentPage === totalPages"
                    class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
    `,

    props: {
        topicId: String,
        subjectId: String
    },

    setup(props, { emit }) {
        // Local state management - simple and reliable
        const notes = Vue.ref([]);
        const loading = Vue.ref(false);
        const expandedNotes = Vue.ref([]);
        const currentPage = Vue.ref(1);
        const itemsPerPage = 10;

        const totalPages = Vue.computed(() => {
            return Math.ceil(notes.value.length / itemsPerPage);
        });

        const paginatedNotes = Vue.computed(() => {
            const start = (currentPage.value - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            return notes.value.slice(start, end);
        });

        const loadNotes = async () => {
            loading.value = true;
            try {
                let loadedNotes = [];
                
                if (props.topicId) {
                    // Load notes for specific topic
                    loadedNotes = await window.api.getNotes(props.topicId);
                } else if (props.subjectId) {
                    // Load all notes for subject
                    const topics = await window.api.getTopics(props.subjectId);
                    const allNotes = await window.api.getAllNotes();
                    const topicIds = topics.map(t => t.id);
                    loadedNotes = allNotes.filter(note => topicIds.includes(note.topic_id));
                } else {
                    // Load all notes
                    loadedNotes = await window.api.getAllNotes();
                }
                
                notes.value = loadedNotes || [];
                console.log('Notes loaded:', notes.value.length);
            } catch (error) {
                console.error('Failed to load notes:', error);
                notes.value = [];
                if (window.store && window.store.showNotification) {
                    window.store.showNotification('Failed to load study materials', 'error');
                }
            } finally {
                loading.value = false;
            }
        };

        const refreshNotes = () => {
            loadNotes();
        };

        const toggleExpanded = (noteId) => {
            const index = expandedNotes.value.indexOf(noteId);
            if (index > -1) {
                expandedNotes.value.splice(index, 1);
            } else {
                expandedNotes.value.push(noteId);
            }
        };

        const copyToClipboard = async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                if (window.store && window.store.showNotification) {
                    window.store.showNotification('Text copied to clipboard!', 'success');
                }
            } catch (error) {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                if (window.store && window.store.showNotification) {
                    window.store.showNotification('Text copied to clipboard!', 'success');
                }
            }
        };

        const generateQuestionsFromNote = async (note) => {
            if (!note.id) {
                if (window.store && window.store.showNotification) {
                    window.store.showNotification('Cannot generate questions: invalid note', 'error');
                }
                return;
            }

            try {
                const questions = await window.api.generateQuestionsForNote(note.id, 5);
                if (window.store && window.store.showNotification) {
                    window.store.showNotification(`Generated ${questions.length} questions from "${getFileName(note.file_name)}"!`, 'success');
                }
                emit('questions-generated', questions);
            } catch (error) {
                console.error('Failed to generate note-specific questions:', error);
                if (window.store && window.store.showNotification) {
                    if (error.message.includes('limit')) {
                        window.store.showNotification('Question generation failed: ' + error.message, 'warning');
                    } else {
                        window.store.showNotification('Failed to generate questions from this note', 'error');
                    }
                }
            }
        };

        const editNote = (note) => {
            // Emit event for parent to handle
            emit('edit-note', note);
        };

        const deleteNote = async (note) => {
            const fileName = getFileName(note.file_name);
            
            if (confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
                try {
                    await window.api.deleteNote(note.id);
                    // Remove note from local state
                    notes.value = notes.value.filter(n => n.id !== note.id);
                    if (window.store && window.store.showNotification) {
                        window.store.showNotification('Study material deleted successfully', 'success');
                    }
                } catch (error) {
                    console.error('Delete note error:', error);
                    if (window.store && window.store.showNotification) {
                        window.store.showNotification('Failed to delete study material', 'error');
                    }
                }
            }
        };

        const getFileIcon = (fileName) => {
            if (!fileName) return 'fas fa-file';
            const ext = fileName.split('.').pop()?.toLowerCase();
            const iconMap = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'txt': 'fas fa-file-alt',
                'jpg': 'fas fa-image',
                'jpeg': 'fas fa-image',
                'png': 'fas fa-image',
                'gif': 'fas fa-image'
            };
            return iconMap[ext] || 'fas fa-file';
        };

        const getFileName = (filePath) => {
            if (!filePath) return 'Unknown file';
            return filePath.split('/').pop() || filePath;
        };

        const getWordCount = (text) => {
            if (!text) return 0;
            return text.trim().split(/\s+/).length;
        };

        const truncateText = (text, length) => {
            if (!text || text.length <= length) return text;
            return text.substring(0, length) + '...';
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                return new Date(dateString).toLocaleString();
            } catch (error) {
                return 'Invalid date';
            }
        };

        // Simple local caches for subjects and topics
        const subjects = Vue.ref([]);
        const allTopics = Vue.ref([]);

        const getSubjectName = (subjectId) => {
            const subject = subjects.value.find(s => s.id === subjectId);
            return subject ? subject.name : 'Unknown Subject';
        };

        const getTopicName = (topicId) => {
            const topic = allTopics.value.find(t => t.id === topicId);
            return topic ? topic.name : 'Loading...';
        };

        // Load subjects and topics for proper name display
        const loadSubjectsAndTopics = async () => {
            try {
                // Load subjects - hardcoded list like before
                subjects.value = [
                    { id: 'mathematics', name: 'Mathematics' },
                    { id: 'natural-sciences', name: 'Natural Sciences' },
                    { id: 'literature', name: 'Literature & Writing' },
                    { id: 'social-studies', name: 'Social Studies' },
                    { id: 'language-arts', name: 'Language Arts' },
                    { id: 'computer-science', name: 'Computer Science' },
                    { id: 'arts', name: 'Arts & Creative' },
                    { id: 'other', name: 'Other Subjects' }
                ];

                // Load all topics from all subjects
                const loadedTopics = [];
                for (const subject of subjects.value) {
                    try {
                        const topics = await window.api.getTopics(subject.id);
                        loadedTopics.push(...topics);
                    } catch (error) {
                        console.warn(`Failed to load topics for ${subject.name}:`, error);
                    }
                }
                allTopics.value = loadedTopics;
            } catch (error) {
                console.error('Failed to load subjects and topics:', error);
            }
        };

        // Load notes on mount
        Vue.onMounted(async () => {
            await loadSubjectsAndTopics();
            loadNotes();
        });

        // Watch for prop changes
        Vue.watch([() => props.topicId, () => props.subjectId], () => {
            loadNotes();
        });

        return {
            notes: paginatedNotes,
            loading,
            expandedNotes,
            currentPage,
            itemsPerPage,
            totalPages,
            refreshNotes,
            toggleExpanded,
            copyToClipboard,
            generateQuestionsFromNote,
            editNote,
            deleteNote,
            getFileIcon,
            getFileName,
            getWordCount,
            truncateText,
            formatDate,
            getSubjectName,
            getTopicName
        };
    },

    emits: ['upload', 'questions-generated', 'edit-note']
};