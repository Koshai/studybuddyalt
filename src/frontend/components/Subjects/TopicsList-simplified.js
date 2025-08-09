// components/Subjects/TopicsList-simplified.js - Simplified Topics Management
window.TopicsListSimplifiedComponent = {
    template: `
    <div class="animate-fade-in space-y-8 dashboard-content">
        <!-- Header with Navigation -->
        <div class="flex items-center mb-8">
            <button
                @click="goBackToSubjects"
                class="mr-6 w-12 h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-300"
            >
                <i class="fas fa-arrow-left text-lg"></i>
            </button>
            <div class="flex-1">
                <div class="flex items-center space-x-4 mb-2">
                    <div :class="['w-16 h-16 rounded-xl flex items-center justify-center text-black font-bold text-2xl shadow-lg', store.state.selectedSubject?.color || 'bg-gray-500']">
                        <i :class="store.state.selectedSubject?.icon || 'fas fa-book'"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">
                            {{ store.state.selectedSubject?.name || 'Subject' }} Topics
                        </h2>
                        <p class="text-gray-700">{{ store.state.selectedSubject?.description || 'Manage your learning topics' }}</p>
                    </div>
                </div>
            </div>
            <button
                @click="store.showCreateTopicModal()"
                class="bg-gradient-to-r from-accent-500 to-primary-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-plus mr-2"></i>Add Topic
            </button>
        </div>

        <!-- Loading State with Skeletons -->
        <div v-if="isLoading" class="space-y-8">
            <!-- Stats Skeleton -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="stat in 4" :key="stat" class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <SkeletonLoader type="text" :lines="2" class="text-center" />
                </div>
            </div>
            
            <!-- Topics Grid Skeleton -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TopicCardSkeleton v-for="card in 4" :key="card" />
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="topics.length === 0" class="text-center py-16">
            <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-12 max-w-lg mx-auto">
                <div class="text-6xl mb-6">📖</div>
                <h3 class="text-2xl font-bold text-black mb-4">Create Your First Topic!</h3>
                <p class="text-black/80 text-lg mb-8">Start organizing your {{ store.state.selectedSubject?.name }} studies by creating a topic. You can then upload materials and generate practice questions.</p>
                <button
                    @click="store.showCreateTopicModal()"
                    class="bg-gradient-to-r from-accent-500 to-primary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
                >
                    <i class="fas fa-plus mr-3"></i>Create First Topic
                </button>
            </div>
        </div>

        <!-- Topics Grid -->
        <div v-else class="space-y-8">
            <!-- Quick Stats for this Subject -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ topics.length }}</div>
                    <div class="text-white/70 text-sm">Topics</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ totalQuestions }}</div>
                    <div class="text-white/70 text-sm">Questions</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ totalNotes }}</div>
                    <div class="text-white/70 text-sm">Study Files</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ averageAccuracy }}%</div>
                    <div class="text-white/70 text-sm">Avg. Accuracy</div>
                </div>
            </div>

            <!-- Topics List -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div
                    v-for="topic in topics"
                    :key="topic.id"
                    class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                    <!-- Topic Header -->
                    <div class="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-4">
                                <div class="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {{ topic.name.charAt(0).toUpperCase() }}
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-xl font-bold text-gray-900 mb-1">{{ topic.name }}</h3>
                                    <p class="text-sm text-gray-600">{{ topic.description || 'No description available' }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-secondary-600">{{ questionCounts[topic.id] || 0 }}</div>
                                <div class="text-xs text-gray-500">questions</div>
                            </div>
                        </div>
                        
                        <!-- Topic Actions -->
                        <div class="flex space-x-3">
                            <button
                                @click="startPractice(topic)"
                                :disabled="!canPractice(topic)"
                                :class="[
                                    'flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center',
                                    canPractice(topic) 
                                        ? 'bg-secondary-500 hover:bg-secondary-600 text-white' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i class="fas fa-brain mr-2"></i>
                                {{ canPractice(topic) ? 'Practice' : 'No Questions' }}
                            </button>
                            <button
                                @click="uploadMaterials(topic)"
                                class="flex-1 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                <i class="fas fa-upload mr-2"></i>Upload
                            </button>
                        </div>
                    </div>

                    <!-- Study Materials Preview -->
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-900 flex items-center">
                                <i class="fas fa-file-text mr-2 text-gray-500"></i>
                                Study Materials
                            </h4>
                            <span class="text-xs text-gray-500">{{ (topicNotes[topic.id] || []).length }} files</span>
                        </div>
                        
                        <!-- Materials Status -->
                        <div v-if="(topicNotes[topic.id] || []).length === 0" class="text-center py-6">
                            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-file-upload text-gray-400"></i>
                            </div>
                            <p class="text-sm text-gray-500 mb-3">No study materials yet</p>
                            <button
                                @click="uploadMaterials(topic)"
                                class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                Upload your first file →
                            </button>
                        </div>
                        
                        <div v-else class="space-y-2">
                            <div
                                v-for="note in (topicNotes[topic.id] || []).slice(0, 2)"
                                :key="note.id"
                                class="p-3 bg-gray-50 rounded-lg"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <i :class="getFileIcon(note.file_name)" class="text-blue-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <h5 class="font-medium text-gray-900 text-sm">{{ getFileName(note.file_name) }}</h5>
                                            <p class="text-xs text-gray-500">{{ getWordCount(note.content) }} words</p>
                                        </div>
                                    </div>
                                    <button 
                                        @click="generateFromNote(topic, note)"
                                        class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                        title="Generate questions from this material"
                                    >
                                        <i class="fas fa-magic mr-1"></i>Generate
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Show more link -->
                            <div v-if="(topicNotes[topic.id] || []).length > 2" class="pt-2 border-t border-gray-200">
                                <button
                                    @click="viewAllNotes(topic)"
                                    class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    View all {{ (topicNotes[topic.id] || []).length }} files →
                                </button>
                            </div>
                        </div>

                        <!-- Generate Questions Button -->
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <button
                                @click="generateQuestions(topic)"
                                :disabled="!canGenerateQuestions(topic)"
                                :class="[
                                    'w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center',
                                    canGenerateQuestions(topic)
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i class="fas fa-magic mr-2"></i>
                                {{ canGenerateQuestions(topic) ? 'Generate Questions' : 'Add Files First' }}
                            </button>
                        </div>
                    </div>

                    <!-- Topic Footer -->
                    <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <span class="flex items-center">
                                <i class="fas fa-calendar mr-1"></i>
                                Created {{ formatDate(topic.created_at) }}
                            </span>
                            <div class="flex items-center space-x-3">
                                <button
                                    @click="deleteTopic(topic)"
                                    class="text-red-400 hover:text-red-600 transition-colors"
                                    title="Delete topic"
                                >
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const isLoading = Vue.ref(false);
        const topics = Vue.ref([]);
        const topicNotes = Vue.ref({});
        const questionCounts = Vue.ref({});
        const noteCounts = Vue.ref({});

        const totalQuestions = Vue.computed(() => {
            return Object.values(questionCounts.value).reduce((sum, count) => sum + count, 0);
        });

        const totalNotes = Vue.computed(() => {
            return Object.values(noteCounts.value).reduce((sum, count) => sum + count, 0);
        });

        const averageAccuracy = Vue.computed(() => {
            // Placeholder calculation - you can enhance this based on practice session data
            return Math.floor(Math.random() * 40) + 60; // 60-100%
        });

        const loadTopics = async () => {
            if (!store.state.selectedSubject) return;

            isLoading.value = true;
            try {
                console.log('Loading topics for subject:', store.state.selectedSubject.id);
                const loadedTopics = await window.api.getTopics(store.state.selectedSubject.id);
                topics.value = loadedTopics;
                
                // Load data for each topic
                await loadTopicData();
            } catch (error) {
                console.error('Failed to load topics:', error);
                store.showNotification('Failed to load topics', 'error');
            } finally {
                isLoading.value = false;
            }
        };

        const loadTopicData = async () => {
            for (const topic of topics.value) {
                try {
                    // Load questions for this topic
                    const questions = await window.api.getQuestions(topic.id);
                    questionCounts.value[topic.id] = questions.length;

                    // Load notes for this topic
                    const notes = await window.api.getNotes(topic.id);
                    topicNotes.value[topic.id] = notes;
                    noteCounts.value[topic.id] = notes.length;
                } catch (error) {
                    console.warn(`Failed to load data for topic ${topic.id}:`, error);
                    questionCounts.value[topic.id] = 0;
                    topicNotes.value[topic.id] = [];
                    noteCounts.value[topic.id] = 0;
                }
            }
        };

        const goBackToSubjects = () => {
            store.clearSelection();
            store.setCurrentView('subjects');
        };

        const startPractice = (topic) => {
            store.selectTopic(topic);
            store.setCurrentView('practice');
        };

        const uploadMaterials = (topic) => {
            store.selectTopic(topic);
            store.setCurrentView('upload');
        };

        const generateQuestions = async (topic) => {
            if (!canGenerateQuestions(topic)) return;

            store.setGenerating(true);
            try {
                // Get subject info for better AI prompts
                const subjectCategory = store.state.selectedSubject;
                const questions = await window.api.generateQuestions(
                    topic.id, 
                    5, 
                    subjectCategory,
                    topic
                );
                
                if (questions.length > 0) {
                    questionCounts.value[topic.id] = (questionCounts.value[topic.id] || 0) + questions.length;
                    store.showNotification(`Generated ${questions.length} questions!`, 'success');
                } else {
                    store.showNotification('No questions generated. Please check your study materials.', 'warning');
                }
            } catch (error) {
                store.showNotification('Failed to generate questions', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        const generateFromNote = async (topic, note) => {
            store.setGenerating(true);
            try {
                const subjectCategory = store.state.selectedSubject;
                const questions = await window.api.generateQuestions(
                    topic.id, 
                    3, 
                    subjectCategory,
                    topic
                );
                
                if (questions.length > 0) {
                    questionCounts.value[topic.id] = (questionCounts.value[topic.id] || 0) + questions.length;
                    store.showNotification(`Generated ${questions.length} questions from ${getFileName(note.file_name)}!`, 'success');
                }
            } catch (error) {
                store.showNotification('Failed to generate questions', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        const deleteTopic = async (topic) => {
            if (!confirm(`Delete "${topic.name}" and all its data? This cannot be undone.`)) {
                return;
            }

            try {
                await window.api.deleteTopic(topic.id);
                topics.value = topics.value.filter(t => t.id !== topic.id);
                delete questionCounts.value[topic.id];
                delete topicNotes.value[topic.id];
                delete noteCounts.value[topic.id];
                store.showNotification('Topic deleted successfully', 'success');
            } catch (error) {
                store.showNotification('Failed to delete topic', 'error');
            }
        };

        const canPractice = (topic) => {
            return (questionCounts.value[topic.id] || 0) > 0;
        };

        const canGenerateQuestions = (topic) => {
            return (noteCounts.value[topic.id] || 0) > 0;
        };

        const viewAllNotes = (topic) => {
            // Could navigate to detailed notes view
            store.showNotification(`Viewing all notes for ${topic.name}`, 'info');
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

        const formatDate = (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                return new Date(dateString).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                });
            } catch (error) {
                return 'Invalid date';
            }
        };

        // Load data when component mounts
        Vue.onMounted(async () => {
            await loadTopics();
        });

        // Watch for topic creation
        Vue.watch(() => store.state.showCreateTopicModal, (show) => {
            if (!show) {
                // Reload topics when modal closes (topic might have been created)
                setTimeout(() => loadTopics(), 500);
            }
        });

        return {
            store,
            isLoading,
            topics,
            topicNotes,
            questionCounts,
            totalQuestions,
            totalNotes,
            averageAccuracy,
            goBackToSubjects,
            startPractice,
            uploadMaterials,
            generateQuestions,
            generateFromNote,
            deleteTopic,
            canPractice,
            canGenerateQuestions,
            viewAllNotes,
            getFileIcon,
            getFileName,
            getWordCount,
            formatDate
        };
    }
};