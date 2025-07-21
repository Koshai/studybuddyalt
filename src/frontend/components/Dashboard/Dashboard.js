// components/Dashboard/Dashboard.js - REWRITTEN with better contrast and structure

window.DashboardComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
        <!-- Welcome Header -->
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-black mb-4">
                <span class="mr-3">🧠</span>Welcome to StudyAI
            </h2>
            <p class="text-black/80 text-lg">Your intelligent learning companion - Track progress, practice questions, and master your subjects!</p>
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Subjects Card -->
            <div 
                class="bg-white rounded-2xl p-6 cursor-pointer hover-lift shadow-lg border border-gray-100 transition-all duration-300"
                @click="store.setCurrentView('subjects')"
            >
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600 mb-1">Total Subjects</p>
                        <p class="text-3xl font-bold text-gray-900 mb-2">{{ store.state.statistics.totalSubjects }}</p>
                        <div class="flex items-center text-primary-600">
                            <i class="fas fa-arrow-up text-xs mr-1"></i>
                            <span class="text-sm font-medium">Active subjects</span>
                        </div>
                    </div>
                    <div class="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
                        <i class="fas fa-book text-2xl text-primary-600"></i>
                    </div>
                </div>
            </div>
            
            <!-- Questions Card -->
            <div 
                class="bg-white rounded-2xl p-6 cursor-pointer hover-lift shadow-lg border border-gray-100 transition-all duration-300"
                @click="store.setCurrentView('practice')"
            >
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600 mb-1">Questions Answered</p>
                        <p class="text-3xl font-bold text-gray-900 mb-2">{{ store.state.statistics.totalAnswered }}</p>
                        <div class="flex items-center text-secondary-600">
                            <i class="fas fa-chart-line text-xs mr-1"></i>
                            <span class="text-sm font-medium">Practice sessions</span>
                        </div>
                    </div>
                    <div class="w-14 h-14 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
                        <i class="fas fa-brain text-2xl text-secondary-600"></i>
                    </div>
                </div>
            </div>
            
            <!-- Accuracy Card -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600 mb-1">Accuracy Rate</p>
                        <p class="text-3xl font-bold text-gray-900 mb-2">{{ store.accuracyPercentage }}%</p>
                        <div class="flex items-center text-accent-600">
                            <i class="fas fa-trophy text-xs mr-1"></i>
                            <span class="text-sm font-medium">Overall performance</span>
                        </div>
                    </div>
                    <div class="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center">
                        <i class="fas fa-target text-2xl text-accent-600"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i class="fas fa-rocket mr-3 text-primary-600"></i>
                Quick Actions
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Create Subject -->
                <button
                    @click="store.showCreateSubjectModal()"
                    class="group p-6 bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-xl transition-all duration-300 text-left border border-primary-200 hover:border-primary-300"
                >
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <i class="fas fa-plus text-xl"></i>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2">Create New Subject</h4>
                    <p class="text-sm text-gray-600">Start organizing your learning by creating a new subject area</p>
                </button>
                
                <!-- Upload Materials -->
                <button
                    @click="store.setCurrentView('upload')"
                    class="group p-6 bg-gradient-to-br from-accent-50 to-accent-100 hover:from-accent-100 hover:to-accent-200 rounded-xl transition-all duration-300 text-left border border-accent-200 hover:border-accent-300"
                >
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <i class="fas fa-upload text-xl"></i>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2">Upload Study Materials</h4>
                    <p class="text-sm text-gray-600">Add notes, PDFs, and documents to build your knowledge base</p>
                </button>
                
                <!-- Quick Practice -->
                <button
                    @click="startQuickPractice"
                    :disabled="!canStartPractice"
                    :class="[
                        'group p-6 rounded-xl transition-all duration-300 text-left border',
                        canStartPractice 
                            ? 'bg-gradient-to-br from-secondary-50 to-secondary-100 hover:from-secondary-100 hover:to-secondary-200 border-secondary-200 hover:border-secondary-300' 
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75'
                    ]"
                >
                    <div class="flex items-center mb-4">
                        <div :class="[
                            'w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform',
                            canStartPractice ? 'bg-secondary-500 group-hover:scale-110' : 'bg-gray-400'
                        ]">
                            <i class="fas fa-brain text-xl"></i>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2">Quick Practice</h4>
                    <p class="text-sm text-gray-600">
                        {{ canStartPractice ? 'Start a practice session with your study materials' : 'Add subjects and materials first to enable practice' }}
                    </p>
                </button>
            </div>
        </div>

        <!-- AI Status & System Info -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- AI System Status -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-microchip mr-3 text-purple-600"></i>
                    AI System Status
                </h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div :class="[
                                'w-3 h-3 rounded-full mr-3',
                                store.state.aiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            ]"></div>
                            <span class="font-medium text-gray-900">Ollama Service</span>
                        </div>
                        <span :class="[
                            'text-sm font-medium px-2 py-1 rounded-full',
                            store.state.aiOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        ]">
                            {{ store.state.aiOnline ? 'Online' : 'Offline' }}
                        </span>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-3 bg-blue-500"></div>
                            <span class="font-medium text-gray-900">Question Generation</span>
                        </div>
                        <span :class="[
                            'text-sm font-medium px-2 py-1 rounded-full',
                            store.state.aiOnline ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        ]">
                            {{ store.state.aiOnline ? 'Ready' : 'Unavailable' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Learning Progress -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-chart-line mr-3 text-blue-600"></i>
                    Learning Progress
                </h3>
                
                <div v-if="store.state.score.total > 0" class="space-y-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Overall Accuracy</span>
                        <span class="text-lg font-bold text-gray-900">{{ store.accuracyPercentage }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                            class="bg-gradient-to-r from-accent-500 to-primary-500 h-3 rounded-full transition-all duration-500"
                            :style="{ width: store.accuracyPercentage + '%' }"
                        ></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div class="text-2xl font-bold text-green-600">{{ store.state.score.correct }}</div>
                            <div class="text-xs text-green-700 font-medium">Correct Answers</div>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div class="text-2xl font-bold text-red-600">{{ store.state.score.total - store.state.score.correct }}</div>
                            <div class="text-xs text-red-700 font-medium">Incorrect Answers</div>
                        </div>
                    </div>
                </div>
                
                <div v-else class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-chart-line text-gray-400 text-2xl"></i>
                    </div>
                    <h4 class="font-medium text-gray-900 mb-2">No Practice Data Yet</h4>
                    <p class="text-sm text-gray-600">Start practicing to see your progress here!</p>
                </div>
            </div>
        </div>

        <!-- DEBUG: Database Contents (Temporary) - COMMENTED OUT -->
        <!-- 
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
            Debug component temporarily removed for cleaner UI
        </div>
        -->

        <!-- Recent Subjects -->
        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-gray-900 flex items-center">
                    <i class="fas fa-clock mr-3 text-orange-600"></i>
                    Recent Subjects
                    <span class="ml-3 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ store.state.subjects.length }}</span>
                </h3>
                <button
                    @click="store.setCurrentView('subjects')"
                    class="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors flex items-center"
                >
                    View all
                    <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
            
            <!-- Debug Info (remove in production)
            <div v-if="store.state.subjects.length > 0" class="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>Debug:</strong> Found {{ store.state.subjects.length }} subjects in store
            </div> -->
            
            <!-- Empty State -->
            <div v-if="store.state.subjects.length === 0" class="text-center py-12">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-book-open text-gray-400 text-3xl"></i>
                </div>
                <h4 class="text-xl font-bold text-gray-900 mb-3">Ready to Start Learning?</h4>
                <p class="text-gray-600 mb-6 max-w-md mx-auto">Create your first subject to begin your learning journey with AI-powered question generation.</p>
                <button
                    @click="store.showCreateSubjectModal()"
                    class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Create Your First Subject
                </button>
            </div>
            
            <!-- Loading State -->
            <div v-else-if="store.state.loading" class="text-center py-12">
                <div class="w-8 h-8 bg-primary-500 rounded-full mx-auto mb-4 animate-pulse"></div>
                <p class="text-gray-600">Loading subjects...</p>
            </div>
            
            <!-- Subjects Grid -->
            <div v-else class="space-y-4">
                <!-- Show raw data for debugging 
                <div class="p-3 bg-gray-50 rounded-lg text-sm">
                    <strong>Raw subjects data:</strong>
                    <pre class="mt-2 text-xs">{{ JSON.stringify(store.state.subjects, null, 2) }}</pre>
                </div> -->
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div
                        v-for="(subject, index) in store.state.subjects"
                        :key="subject.id || index"
                        @click="store.selectSubject(subject)"
                        class="group p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-lg cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-50 to-white"
                    >
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                                {{ (subject.name || 'Unknown').charAt(0).toUpperCase() }}
                            </div>
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {{ formatDate(subject.created_at) }}
                            </span>
                        </div>
                        <h4 class="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                            {{ subject.name || 'Unnamed Subject' }}
                        </h4>
                        <p class="text-sm text-gray-600 line-clamp-2 mb-4">
                            {{ subject.description || 'No description available - click to add topics and start learning!' }}
                        </p>
                        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span class="text-xs text-gray-500 flex items-center">
                                <i class="fas fa-layer-group mr-1"></i>
                                {{ topicCounts[subject.id] || 0 }} topics
                            </span>
                            <div class="flex items-center space-x-1">
                                <div class="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                                <span class="text-xs text-accent-600 font-medium">Ready</span>
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
        const topicCounts = Vue.ref({});

        // Debug data
        const debugSubjects = Vue.ref([]);
        const debugTopics = Vue.ref([]);
        const debugNotes = Vue.ref([]);
        const debugQuestions = Vue.ref([]);
        const debugLoading = Vue.ref(false);

        const recentSubjects = Vue.computed(() => {
            return store.state.subjects
                .slice()
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 6);
        });

        const canStartPractice = Vue.computed(() => {
            return store.state.subjects.length > 0;
        });

        const startQuickPractice = () => {
            if (canStartPractice.value) {
                store.setCurrentView('practice');
            } else {
                store.showNotification('Create subjects and add study materials first!', 'info');
            }
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

        // Debug functions
        const refreshDebugData = async () => {
            debugLoading.value = true;
            try {
                // Load subjects
                debugSubjects.value = await window.api.getSubjects();
                console.log('Debug: Loaded subjects:', debugSubjects.value);

                // Load all topics for all subjects
                debugTopics.value = [];
                for (const subject of debugSubjects.value) {
                    try {
                        const subjectTopics = await window.api.getTopics(subject.id);
                        debugTopics.value.push(...subjectTopics);
                    } catch (error) {
                        console.warn(`Failed to load topics for subject ${subject.id}:`, error);
                    }
                }
                console.log('Debug: Loaded topics:', debugTopics.value);

                // Load all notes for all topics
                debugNotes.value = [];
                
                // First try to get notes by topic
                for (const topic of debugTopics.value) {
                    try {
                        const topicNotes = await window.api.getNotes(topic.id);
                        debugNotes.value.push(...topicNotes);
                    } catch (error) {
                        console.warn(`Failed to load notes for topic ${topic.id}:`, error);
                    }
                }
                
                // If no notes found and we have the getAllNotes method, try that
                if (debugNotes.value.length === 0 && window.api.getAllNotes) {
                    try {
                        debugNotes.value = await window.api.getAllNotes();
                        console.log('Debug: Loaded notes via getAllNotes:', debugNotes.value);
                    } catch (error) {
                        console.warn('Failed to load all notes:', error);
                    }
                }
                
                // If still no notes, try direct API call
                if (debugNotes.value.length === 0) {
                    try {
                        const response = await fetch('http://localhost:3001/api/debug/notes');
                        if (response.ok) {
                            debugNotes.value = await response.json();
                            console.log('Debug: Loaded notes via direct API call:', debugNotes.value);
                        }
                    } catch (error) {
                        console.warn('Failed direct notes API call:', error);
                    }
                }
                
                console.log('Debug: Final loaded notes:', debugNotes.value);

                // Load all questions for all topics
                debugQuestions.value = [];
                for (const topic of debugTopics.value) {
                    try {
                        const topicQuestions = await window.api.getQuestions(topic.id);
                        debugQuestions.value.push(...topicQuestions);
                    } catch (error) {
                        console.warn(`Failed to load questions for topic ${topic.id}:`, error);
                    }
                }
                console.log('Debug: Loaded questions:', debugQuestions.value);

            } catch (error) {
                console.error('Debug: Error loading data:', error);
            } finally {
                debugLoading.value = false;
            }
        };

        const debugGetSubjectName = (subjectId) => {
            const subject = debugSubjects.value.find(s => s.id === subjectId);
            return subject ? subject.name : 'Unknown Subject';
        };

        const debugGetTopicName = (topicId) => {
            const topic = debugTopics.value.find(t => t.id === topicId);
            return topic ? topic.name : 'Unknown Topic';
        };

        const debugGetDifficultyClass = (difficulty) => {
            const classes = {
                'easy': 'bg-green-100 text-green-700',
                'medium': 'bg-yellow-100 text-yellow-700',
                'hard': 'bg-red-100 text-red-700'
            };
            return classes[difficulty] || classes.medium;
        };

        const debugFormatDate = (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                return new Date(dateString).toLocaleString();
            } catch (error) {
                return 'Invalid date';
            }
        };

        const debugTruncateText = (text, length) => {
            if (!text || text.length <= length) return text;
            return text.substring(0, length) + '...';
        };

        const debugGetWordCount = (text) => {
            if (!text) return 0;
            return text.trim().split(/\s+/).length;
        };

        // Load topic counts for each subject
        const loadTopicCounts = async () => {
            for (const subject of store.state.subjects) {
                try {
                    const topics = await window.api.getTopics(subject.id);
                    topicCounts.value[subject.id] = topics.length;
                } catch (error) {
                    console.warn(`Failed to load topics for subject ${subject.id}:`, error);
                    topicCounts.value[subject.id] = 0;
                }
            }
        };

        // Watch for subjects changes and reload topic counts
        Vue.watch(() => store.state.subjects, () => {
            loadTopicCounts();
        }, { immediate: true });

        // Load subjects on mount if not already loaded
        Vue.onMounted(async () => {
            console.log('Dashboard mounted, current subjects:', store.state.subjects);
            
            if (store.state.subjects.length === 0) {
                try {
                    store.setLoading(true);
                    const subjects = await window.api.getSubjects();
                    console.log('Loaded subjects from API:', subjects);
                    store.setSubjects(subjects);
                } catch (error) {
                    console.error('Failed to load subjects:', error);
                    store.showNotification('Failed to load subjects', 'error');
                } finally {
                    store.setLoading(false);
                }
            }

            // Load debug data
            await refreshDebugData();
        });

        return {
            store,
            recentSubjects,
            canStartPractice,
            startQuickPractice,
            formatDate,
            topicCounts,
            // Debug data and functions
            debugSubjects,
            debugTopics,
            debugNotes,
            debugQuestions,
            debugLoading,
            refreshDebugData,
            debugGetSubjectName,
            debugGetTopicName,
            debugGetDifficultyClass,
            debugFormatDate,
            debugTruncateText,
            debugGetWordCount
        };
    }
};