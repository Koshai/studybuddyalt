// components/Modals/NoteEditorModal.js - Rich Text Note Editor Modal
window.NoteEditorModalComponent = {
    template: `
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-edit text-white"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold">{{ isEditing ? 'Edit Note' : 'Create New Note' }}</h2>
                            <p class="text-white/80 text-sm">{{ isEditing ? 'Modify your study material' : 'Create a new study note from scratch' }}</p>
                        </div>
                    </div>
                    <button 
                        @click="closeModal"
                        class="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <!-- Note Title and Metadata -->
                <div class="mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <!-- Note Title -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Note Title</label>
                            <input
                                v-model="noteData.title"
                                type="text"
                                placeholder="Enter note title..."
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <!-- Topic Selection (for new notes) -->
                        <div v-if="!isEditing">
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

                        <!-- Show current topic for editing -->
                        <div v-else-if="originalNote">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                            <div class="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
                                {{ getTopicName(originalNote.topic_id) }} ({{ getSubjectName(originalNote.subject_id) }})
                            </div>
                        </div>
                    </div>

                    <!-- Original File Info (for edited notes) -->
                    <div v-if="isEditing && originalNote && originalNote.file_name" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <i :class="getFileIcon(originalNote.file_name)" class="text-blue-600"></i>
                            <div>
                                <p class="text-sm font-medium text-blue-900">Originally extracted from:</p>
                                <p class="text-sm text-blue-700">{{ getFileName(originalNote.file_name) }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rich Text Editor -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
                    <div class="border border-gray-300 rounded-lg overflow-hidden">
                        <!-- Quill Editor Container -->
                        <div ref="editorContainer" class="h-64"></div>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">
                        Use the toolbar above to format your text. You can make text bold, italic, create lists, and more.
                    </p>
                </div>

                <!-- Preview Mode Toggle -->
                <div class="mb-4">
                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input 
                            v-model="showPreview" 
                            type="checkbox" 
                            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span class="text-sm font-medium text-gray-700">Show Preview</span>
                    </label>
                </div>

                <!-- Content Preview -->
                <div v-if="showPreview" class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div class="prose prose-sm max-w-none" v-html="noteContent"></div>
                </div>

                <!-- Statistics -->
                <div class="mb-6 grid grid-cols-3 gap-4">
                    <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-lg font-bold text-gray-900">{{ wordCount }}</div>
                        <div class="text-sm text-gray-600">Words</div>
                    </div>
                    <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-lg font-bold text-gray-900">{{ characterCount }}</div>
                        <div class="text-sm text-gray-600">Characters</div>
                    </div>
                    <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-lg font-bold text-gray-900">{{ paragraphCount }}</div>
                        <div class="text-sm text-gray-600">Paragraphs</div>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div class="text-sm text-gray-500">
                    {{ isEditing ? 'Editing note' : 'Creating new note' }}
                </div>
                <div class="flex space-x-3">
                    <button
                        @click="closeModal"
                        class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="saveNote"
                        :disabled="loading || !canSave"
                        :class="[
                            'px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2',
                            (loading || !canSave) ? 'opacity-50 cursor-not-allowed' : ''
                        ]"
                    >
                        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-save"></i>
                        <span>{{ isEditing ? 'Update Note' : 'Create Note' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    `,

    props: {
        show: {
            type: Boolean,
            default: false
        },
        note: {
            type: Object,
            default: null
        }
    },

    setup(props, { emit }) {
        const loading = Vue.ref(false);
        const showPreview = Vue.ref(false);
        const editorContainer = Vue.ref(null);
        const quillEditor = Vue.ref(null);
        const selectedTopicId = Vue.ref('');
        const availableTopics = Vue.ref([]);
        const editorContent = Vue.ref(''); // Reactive content tracker

        // Note data
        const noteData = Vue.reactive({
            title: '',
            content: ''
        });

        // Computed properties
        const isEditing = Vue.computed(() => props.note !== null);
        const originalNote = Vue.computed(() => props.note);
        
        const noteContent = Vue.computed(() => {
            return quillEditor.value ? quillEditor.value.root.innerHTML : '';
        });

        const wordCount = Vue.computed(() => {
            if (!quillEditor.value) return 0;
            const text = quillEditor.value.getText();
            return text.trim().split(/\s+/).filter(word => word.length > 0).length;
        });

        const characterCount = Vue.computed(() => {
            if (!quillEditor.value) return 0;
            return quillEditor.value.getText().length;
        });

        const paragraphCount = Vue.computed(() => {
            if (!quillEditor.value) return 0;
            const text = quillEditor.value.getText();
            return text.split('\n').filter(p => p.trim().length > 0).length;
        });

        const canSave = Vue.computed(() => {
            const hasTitle = noteData.title.trim().length > 0;
            // Use reactive editorContent instead of direct quill access
            const hasContent = editorContent.value.trim().length > 0;
            const hasTopic = isEditing.value || selectedTopicId.value;
            const notLoading = !loading.value;
            
            const canSaveResult = hasTitle && hasContent && hasTopic && notLoading;
            
            // Debug logging (remove after fixing)
            console.log('🔍 canSave check:', {
                hasTitle,
                hasContent,
                hasTopic,
                notLoading,
                canSaveResult,
                titleValue: noteData.title,
                contentLength: editorContent.value.length,
                isEditing: isEditing.value,
                selectedTopicId: selectedTopicId.value
            });
            
            return canSaveResult;
        });

        // Initialize Quill editor
        const initializeEditor = () => {
            Vue.nextTick(() => {
                if (editorContainer.value && !quillEditor.value) {
                    if (window.Quill) {
                        try {
                            quillEditor.value = new window.Quill(editorContainer.value, {
                                theme: 'snow',
                                placeholder: 'Start writing your note...',
                                modules: {
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['blockquote', 'code-block'],
                                        ['link'],
                                        ['clean']
                                    ]
                                }
                            });

                            // Enable the editor (make sure it's editable)
                            quillEditor.value.enable(true);
                            
                            // Add content change listener to update reactive content
                            quillEditor.value.on('text-change', () => {
                                editorContent.value = quillEditor.value.getText();
                                console.log('📝 Content changed:', editorContent.value.length, 'characters');
                            });
                            
                            console.log('📝 Quill editor initialized:', {
                                isEnabled: !quillEditor.value.isEnabled || quillEditor.value.isEnabled(),
                                hasToolbar: !!quillEditor.value.getModule('toolbar'),
                                container: !!quillEditor.value.container
                            });

                            // Set initial content if editing
                            if (isEditing.value && props.note) {
                                console.log('🔍 Setting initial content:', {
                                    isEditing: isEditing.value,
                                    noteId: props.note.id,
                                    hasContent: !!props.note.content,
                                    contentLength: props.note.content?.length || 0,
                                    contentPreview: props.note.content?.substring(0, 100) || 'No content'
                                });
                                
                                // Use setText for plain text or setContents for HTML
                                if (props.note.content) {
                                    // If content looks like HTML, use innerHTML
                                    if (props.note.content.includes('<') && props.note.content.includes('>')) {
                                        quillEditor.value.root.innerHTML = props.note.content;
                                    } else {
                                        // Plain text content
                                        quillEditor.value.setText(props.note.content);
                                    }
                                } else {
                                    quillEditor.value.setText('');
                                }
                                
                                console.log('✅ Content set in editor');
                            } else {
                                console.log('🔍 No initial content to set:', {
                                    isEditing: isEditing.value,
                                    hasNote: !!props.note
                                });
                            }
                        } catch (error) {
                            console.error('Failed to initialize Quill editor:', error);
                            store.showNotification('Editor failed to load. Please refresh and try again.', 'error');
                        }
                    } else {
                        // Quill not loaded yet, retry after a short delay
                        console.warn('Quill not loaded yet, retrying...');
                        setTimeout(initializeEditor, 100);
                    }
                }
            });
        };

        // Load available topics
        const loadAvailableTopics = async () => {
            try {
                // Get all topics for current user from all subjects
                availableTopics.value = [];
                
                // Hardcoded subjects list
                const subjects = [
                    { id: 'mathematics', name: 'Mathematics' },
                    { id: 'natural-sciences', name: 'Natural Sciences' },
                    { id: 'literature', name: 'Literature & Writing' },
                    { id: 'social-studies', name: 'Social Studies' },
                    { id: 'language-arts', name: 'Language Arts' },
                    { id: 'computer-science', name: 'Computer Science' },
                    { id: 'arts', name: 'Arts & Creative' },
                    { id: 'other', name: 'Other Subjects' }
                ];
                
                for (const subject of subjects) {
                    try {
                        const topics = await window.api.getTopics(subject.id);
                        availableTopics.value.push(...topics);
                    } catch (error) {
                        console.warn(`Failed to load topics for ${subject.name}:`, error);
                    }
                }
            } catch (error) {
                console.error('Failed to load topics:', error);
                if (window.store && window.store.showNotification) {
                    window.store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        // Setup note data when modal opens
        const setupNoteData = () => {
            if (isEditing.value && props.note) {
                console.log('🔍 Setting up note data for editing:', props.note);
                noteData.title = getFileName(props.note.file_name) || props.note.title || 'Untitled Note';
                
                // Log the note content for debugging
                console.log('📝 Note content:', {
                    rawContent: props.note.content,
                    contentType: typeof props.note.content,
                    contentLength: props.note.content?.length || 0
                });
            } else {
                // Reset for new note
                noteData.title = '';
                selectedTopicId.value = '';
                console.log('🔍 Setting up for new note creation');
            }
        };

        // Save note
        const saveNote = async () => {
            if (!canSave.value) return;

            loading.value = true;
            try {
                const content = quillEditor.value.root.innerHTML;
                const plainText = quillEditor.value.getText();

                if (isEditing.value) {
                    // Update existing note using direct API
                    const updateData = {
                        content: content,
                        title: noteData.title.trim(),
                        file_name: noteData.title.trim() + '.html' // Store as HTML file
                    };

                    await window.api.updateNote(props.note.id, updateData);
                    
                    if (window.store && window.store.showNotification) {
                        window.store.showNotification('Note updated successfully!', 'success');
                    }
                    console.log('✅ Note updated, emitting note-saved event');
                } else {
                    // Create new note using direct API
                    const newNoteData = {
                        topicId: selectedTopicId.value,
                        content: content,
                        fileName: noteData.title.trim() + '.html',
                        title: noteData.title.trim()
                    };

                    await window.api.createNote(newNoteData.topicId, newNoteData.fileName, newNoteData.content, newNoteData.title);
                    
                    if (window.store && window.store.showNotification) {
                        window.store.showNotification('Note created successfully!', 'success');
                    }
                }

                emit('note-saved');
                closeModal();
            } catch (error) {
                console.error('Failed to save note:', error);
                if (window.store && window.store.showNotification) {
                    window.store.showNotification('Failed to save note: ' + error.message, 'error');
                }
            } finally {
                loading.value = false;
            }
        };

        // Close modal
        const closeModal = () => {
            console.log('🔄 Closing note editor modal...');
            
            // Reset editor content
            if (quillEditor.value) {
                quillEditor.value.setText('');
            }
            
            // Reset form data
            noteData.title = '';
            selectedTopicId.value = '';
            showPreview.value = false;
            editorContent.value = '';
            
            // Clear the editor reference so it gets reinitialized next time
            quillEditor.value = null;
            
            emit('close');
        };

        // Helper functions
        const getFileIcon = (fileName) => {
            if (!fileName) return 'fas fa-file';
            const ext = fileName.split('.').pop()?.toLowerCase();
            const iconMap = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'txt': 'fas fa-file-alt',
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

        // Local subjects cache
        const subjects = Vue.ref([
            { id: 'mathematics', name: 'Mathematics' },
            { id: 'natural-sciences', name: 'Natural Sciences' },
            { id: 'literature', name: 'Literature & Writing' },
            { id: 'social-studies', name: 'Social Studies' },
            { id: 'language-arts', name: 'Language Arts' },
            { id: 'computer-science', name: 'Computer Science' },
            { id: 'arts', name: 'Arts & Creative' },
            { id: 'other', name: 'Other Subjects' }
        ]);

        const getSubjectName = (subjectId) => {
            const subject = subjects.value.find(s => s.id === subjectId);
            return subject ? subject.name : 'Unknown Subject';
        };

        const getTopicName = (topicId) => {
            // Try local availableTopics
            const topic = availableTopics.value.find(t => t.id === topicId);
            return topic ? topic.name : 'Loading...';
        };

        // Method to set content after editor is ready
        const setEditorContent = () => {
            if (quillEditor.value && isEditing.value && props.note && props.note.content) {
                console.log('🔄 Setting editor content after initialization:', {
                    contentPreview: props.note.content.substring(0, 100),
                    isHTML: props.note.content.includes('<') && props.note.content.includes('>')
                });
                
                try {
                    // Clear any existing content first
                    quillEditor.value.setText('');
                    
                    // Set content based on type
                    if (props.note.content.includes('<') && props.note.content.includes('>')) {
                        // HTML content
                        quillEditor.value.root.innerHTML = props.note.content;
                    } else {
                        // Plain text - preserve line breaks by converting to HTML
                        const htmlContent = props.note.content
                            .replace(/\n\n+/g, '</p><p>')
                            .replace(/\n/g, '<br>')
                            .replace(/^/, '<p>')
                            .replace(/$/, '</p>');
                        quillEditor.value.root.innerHTML = htmlContent;
                    }
                    
                    // Update reactive content tracker
                    editorContent.value = quillEditor.value.getText();
                    
                    console.log('✅ Editor content set successfully');
                } catch (error) {
                    console.error('❌ Failed to set editor content:', error);
                    // Fallback to plain text
                    quillEditor.value.setText(props.note.content);
                    editorContent.value = quillEditor.value.getText();
                }
            }
        };

        // Watchers
        Vue.watch(() => props.show, (newShow) => {
            if (newShow) {
                setupNoteData();
                loadAvailableTopics();
                Vue.nextTick(() => {
                    initializeEditor();
                    // Wait a bit more for editor to be fully ready
                    setTimeout(setEditorContent, 200);
                });
            }
        });

        // Watch for quillEditor changes to set content when ready
        Vue.watch(() => quillEditor.value, (newEditor) => {
            if (newEditor && isEditing.value && props.note) {
                Vue.nextTick(() => {
                    setEditorContent();
                });
            }
        });

        return {
            store,
            loading,
            showPreview,
            editorContainer,
            quillEditor,
            selectedTopicId,
            availableTopics,
            noteData,
            isEditing,
            originalNote,
            noteContent,
            wordCount,
            characterCount,
            paragraphCount,
            canSave,
            saveNote,
            closeModal,
            getFileIcon,
            getFileName,
            getSubjectName,
            getTopicName
        };
    },

    emits: ['close', 'note-saved']
};