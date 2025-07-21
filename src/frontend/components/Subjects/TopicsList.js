// components/Subjects/TopicsList.js - REDESIGNED with better organization
window.TopicsListComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
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
                    <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {{ store.state.selectedSubject?.name?.charAt(0).toUpperCase() || 'S' }}
                    </div>
                    <div>
                        <h2 class="text-2xl md:text-3xl font-bold text-white">
                            {{ store.state.selectedSubject?.name || 'Subject' }} Topics
                        </h2>
                        <p class="text-white/80">{{ store.state.selectedSubject?.description || 'Explore specific topics and practice questions' }}</p>
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

        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-12">
            <div class="w-8 h-8 bg-white/20 rounded-full mx-auto mb-4 animate-pulse"></div>
            <p class="text-white text-xl">Loading topics...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="store.state.topics.length === 0" class="text-center py-16">
            <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-12 max-w-lg mx-auto">
                <div class="text-6xl mb-6">📖</div>
                <h3 class="text-2xl font-bold text-white mb-4">Ready to Dive Deeper?</h3>
                <p class="text-white/80 text-lg mb-8">Create your first topic in {{ store.state.selectedSubject?.name }} to organize your study materials and generate focused questions.</p>
                <button
                    @click="store.showCreateTopicModal()"
                    class="bg-gradient-to-r from-accent-500 to-primary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
                >
                    <i class="fas fa-plus mr-3"></i>Create First Topic
                </button>
            </div>
        </div>

        <!-- Topics Layout -->
        <div v-else class="space-y-8">
            <!-- Quick Stats for this Subject -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ store.state.topics.length }}</div>
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

            <!-- Topics Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div
                    v-for="topic in store.state.topics"
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
                                {{ canPractice(topic) ? 'Start Practice' : 'No Questions' }}
                            </button>
                            <button
                                @click="uploadMaterials(topic)"
                                class="flex-1 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                <i class="fas fa-upload mr-2"></i>Upload Files
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
                        
                        <!-- Materials List -->
                        <div v-if="(topicNotes[topic.id] || []).length === 0" class="text-center py-8">
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
                        
                        <div v-else class="space-y-3">
                            <div
                                v-for="note in (topicNotes[topic.id] || []).slice(0, 3)"
                                :key="note.id"
                                class="group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <i :class="getFileIcon(note.file_name)" class="text-blue-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <h5 class="font-medium text-gray-900 text-sm">{{ getFileName(note.file_name) }}</h5>
                                            <p class="text-xs text-gray-500">{{ formatDate(note.created_at) }}</p>
                                        </div>
                                    </div>
                                    <div class="text-xs text-gray-400">
                                        {{ getWordCount(note.content) }} words
                                    </div>
                                </div>
                                <!-- Content preview -->
                                <div class="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                                    {{ truncateText(note.content, 100) }}
                                </div>
                            </div>
                            
                            <!-- Show more files link -->
                            <div v-if="(topicNotes[topic.id] || []).length > 3" class="pt-2 border-t border-gray-200">
                                <button
                                    @click="viewAllNotes(topic)"
                                    class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    View all {{ (topicNotes[topic.id] || []).length }} files →
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Questions Preview -->
                    <div class="p-6 pt-0">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-900 flex items-center">
                                <i class="fas fa-question-circle mr-2 text-gray-500"></i>
                                Practice Questions
                            </h4>
                            <button
                                @click="generateQuestions(topic)"
                                :disabled="!canGenerateQuestions(topic)"
                                :class="[
                                    'text-xs px-3 py-1 rounded-full font-medium transition-colors',
                                    canGenerateQuestions(topic)
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i class="fas fa-magic mr-1"></i>
                                {{ canGenerateQuestions(topic) ? 'Generate' : 'Add Files First' }}
                            </button>
                        </div>
                        
                        <!-- Questions List -->
                        <div v-if="(topicQuestions[topic.id] || []).length === 0" class="text-center py-6">
                            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <i class="fas fa-brain text-gray-400"></i>
                            </div>
                            <p class="text-sm text-gray-500 mb-2">No questions generated yet</p>
                            <p class="text-xs text-gray-400">Upload study materials first, then generate AI questions</p>
                        </div>
                        
                        <div v-else class="space-y-2">
                            <div
                                v-for="question in (topicQuestions[topic.id] || []).slice(0, 2)"
                                :key="question.id"
                                class="p-3 bg-purple-50 rounded-lg border border-purple-100"
                            >
                                <p class="text-sm text-gray-800 font-medium mb-1">{{ truncateText(question.question, 80) }}</p>
                                <div class="flex items-center justify-between">
                                    <span :class="[
                                        'text-xs px-2 py-1 rounded-full',
                                        getDifficultyColor(question.difficulty)
                                    ]">
                                        {{ question.difficulty || 'medium' }}
                                    </span>
                                    <span class="text-xs text-gray-500">{{ formatDate(question.created_at) }}</span>
                                </div>
                            </div>
                            
                            <!-- Practice button -->
                            <div class="pt-2 border-t border-purple-200">
                                <button
                                    @click="startPractice(topic)"
                                    class="w-full text-sm text-purple-700 hover:text-purple-800 font-medium py-2"
                                >
                                    Practice all {{ (topicQuestions[topic.id] || []).length }} questions →
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Topic Footer -->
                    <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <span class="flex items-center">
                                <i class="fas fa-calendar mr-1"></i>
                                Created {{ formatDate(topic.created_at) }}
                            </span>
                            <div class="flex items-center space-x-4">
                                <span class="flex items-center">
                                    <i class="fas fa-chart-line mr-1"></i>
                                    {{ topicAccuracy[topic.id] || 0 }}% accuracy
                                </span>
                                <span class="flex items-center">
                                    <div class="w-2 h-2 bg-accent-500 rounded-full mr-1"></div>
                                    Ready
                                </span>
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
        const topicNotes = Vue.ref({});
        const topicQuestions = Vue.ref({});
        const questionCounts = Vue.ref({});
        const noteCounts = Vue.ref({});
        const topicAccuracy = Vue.ref({});

        const totalQuestions = Vue.computed(() => {
            return Object.values(questionCounts.value).reduce((sum, count) => sum + count, 0);
        });

        const totalNotes = Vue.computed(() => {
            return Object.values(noteCounts.value).reduce((sum, count) => sum + count, 0);
        });

        const averageAccuracy = Vue.computed(() => {
            const accuracies = Object.values(topicAccuracy.value).filter(acc => acc > 0);
            if (accuracies.length === 0) return 0;
            return Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length);
        });

        const loadTopicData = async () => {
            for (const topic of store.state.topics) {
                try {
                    // Load questions for this topic
                    const questions = await window.api.getQuestions(topic.id);
                    topicQuestions.value[topic.id] = questions;
                    questionCounts.value[topic.id] = questions.length;

                    // Load notes for this topic
                    try {
                        const notes = await window.api.getNotes(topic.id);
                        topicNotes.value[topic.id] = notes;
                        noteCounts.value[topic.id] = notes.length;
                        console.log(`Loaded ${notes.length} notes for topic ${topic.name}:`, notes);
                    } catch (noteError) {
                        console.warn(`Notes API failed for topic ${topic.id}, trying fallback:`, noteError);
                        // Fallback: try direct API call for notes
                        try {
                            const response = await fetch(`http://localhost:3001/api/topics/${topic.id}/notes`);
                            if (response.ok) {
                                const notes = await response.json();
                                topicNotes.value[topic.id] = notes;
                                noteCounts.value[topic.id] = notes.length;
                                console.log(`Fallback loaded ${notes.length} notes for topic ${topic.name}`);
                            } else {
                                console.warn(`Fallback API call failed with status: ${response.status}`);
                                topicNotes.value[topic.id] = [];
                                noteCounts.value[topic.id] = 0;
                            }
                        } catch (fallbackError) {
                            console.warn('Fallback notes loading failed:', fallbackError);
                            topicNotes.value[topic.id] = [];
                            noteCounts.value[topic.id] = 0;
                        }
                    }

                    // Calculate topic accuracy (placeholder)
                    topicAccuracy.value[topic.id] = Math.floor(Math.random() * 40) + 60; // 60-100%

                } catch (error) {
                    console.warn(`Failed to load data for topic ${topic.id}:`, error);
                    topicQuestions.value[topic.id] = [];
                    topicNotes.value[topic.id] = [];
                    questionCounts.value[topic.id] = 0;
                    noteCounts.value[topic.id] = 0;
                    topicAccuracy.value[topic.id] = 0;
                }
            }
        };

        const loadTopics = async () => {
            if (!store.state.selectedSubject) return;

            isLoading.value = true;
            try {
                const topics = await window.api.getTopics(store.state.selectedSubject.id);
                store.setTopics(topics);
                await loadTopicData();
            } catch (error) {
                console.error('Failed to load topics:', error);
                store.showNotification('Failed to load topics', 'error');
            } finally {
                isLoading.value = false;
            }
        };

        const goBackToSubjects = () => {
            store.clearSelection();
            store.setCurrentView('subjects');
        };

        const startPractice = (topic) => {
            store.selectTopic(topic);
            // Load questions for this topic before going to practice
            loadQuestionsForPractice(topic);
        };

        const loadQuestionsForPractice = async (topic) => {
            try {
                const questions = await window.api.getQuestions(topic.id);
                if (questions.length > 0) {
                    store.setQuestions(questions);
                    store.setCurrentView('practice');
                    store.showNotification(`Loaded ${questions.length} questions for practice!`, 'success');
                } else {
                    store.showNotification('No questions available. Generate some first!', 'info');
                }
            } catch (error) {
                console.error('Failed to load questions for practice:', error);
                store.showNotification('Failed to load questions', 'error');
            }
        };

        const uploadMaterials = (topic) => {
            store.selectTopic(topic);
            store.setCurrentView('upload');
        };

        const generateQuestions = async (topic) => {
            if (!canGenerateQuestions(topic)) return;

            store.setGenerating(true);
            try {
                const questions = await window.api.generateQuestions(topic.id, 5, 'medium');
                topicQuestions.value[topic.id] = [...(topicQuestions.value[topic.id] || []), ...questions];
                questionCounts.value[topic.id] = topicQuestions.value[topic.id].length;
                store.showNotification('Questions generated successfully!', 'success');
            } catch (error) {
                store.showNotification('Failed to generate questions. Add study materials first.', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        const canPractice = (topic) => {
            return (questionCounts.value[topic.id] || 0) > 0;
        };

        const canGenerateQuestions = (topic) => {
            return (noteCounts.value[topic.id] || 0) > 0;
        };

        const viewAllNotes = (topic) => {
            // Navigate to a detailed notes view (could be implemented later)
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

        const truncateText = (text, length) => {
            if (!text || text.length <= length) return text;
            return text.substring(0, length) + '...';
        };

        const getDifficultyColor = (difficulty) => {
            const colorMap = {
                'easy': 'bg-green-100 text-green-700',
                'medium': 'bg-yellow-100 text-yellow-700',
                'hard': 'bg-red-100 text-red-700'
            };
            return colorMap[difficulty] || colorMap.medium;
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

        // Watch for topics changes
        Vue.watch(() => store.state.topics, async () => {
            await loadTopicData();
        }, { deep: true });

        return {
            store,
            isLoading,
            topicNotes,
            topicQuestions,
            questionCounts,
            noteCounts,
            topicAccuracy,
            totalQuestions,
            totalNotes,
            averageAccuracy,
            goBackToSubjects,
            startPractice,
            loadQuestionsForPractice,
            uploadMaterials,
            generateQuestions,
            canPractice,
            canGenerateQuestions,
            viewAllNotes,
            getFileIcon,
            getFileName,
            getWordCount,
            getDifficultyColor,
            truncateText,
            formatDate
        };
    }
};