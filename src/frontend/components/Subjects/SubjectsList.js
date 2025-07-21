// components/Subjects/SubjectsList.js - REDESIGNED with better organization
window.SubjectsListComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 class="text-2xl md:text-3xl font-bold text-black mb-2">
                    <span class="mr-3">📚</span>My Learning Subjects
                </h2>
                <p class="text-black/80">Organize your learning by subjects and topics - {{ store.state.subjects.length }} subjects total</p>
            </div>
            <button
                @click="store.showCreateSubjectModal()"
                class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-plus mr-2"></i>Add New Subject
            </button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-12">
            <div class="w-8 h-8 bg-white/20 rounded-full mx-auto mb-4 animate-pulse"></div>
            <p class="text-white text-xl">Loading your subjects...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="store.state.subjects.length === 0" class="text-center py-16">
            <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto">
                <div class="text-6xl mb-6">📚</div>
                <h3 class="text-2xl font-bold text-white mb-4">Start Your Learning Journey!</h3>
                <p class="text-white/80 text-lg mb-8">Create your first subject to organize your study materials and generate AI-powered questions.</p>
                <button
                    @click="store.showCreateSubjectModal()"
                    class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
                >
                    <i class="fas fa-rocket mr-3"></i>Create First Subject
                </button>
            </div>
        </div>

        <!-- Subjects Layout -->
        <div v-else class="space-y-8">
            <!-- Quick Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ store.state.subjects.length }}</div>
                    <div class="text-white/70 text-sm">Subjects</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ totalTopics }}</div>
                    <div class="text-white/70 text-sm">Topics</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ totalQuestions }}</div>
                    <div class="text-white/70 text-sm">Questions</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-white">{{ store.accuracyPercentage }}%</div>
                    <div class="text-white/70 text-sm">Accuracy</div>
                </div>
            </div>

            <!-- Subjects Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div
                    v-for="subject in store.state.subjects"
                    :key="subject.id"
                    class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                    <!-- Subject Header -->
                    <div class="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-4">
                                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {{ subject.name.charAt(0).toUpperCase() }}
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-gray-900 mb-1">{{ subject.name }}</h3>
                                    <p class="text-sm text-gray-600">{{ subject.description || 'No description' }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-primary-600">{{ topicCounts[subject.id] || 0 }}</div>
                                <div class="text-xs text-gray-500">topics</div>
                            </div>
                        </div>
                        
                        <!-- Subject Actions -->
                        <div class="flex space-x-3">
                            <button
                                @click="viewSubjectTopics(subject)"
                                class="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                <i class="fas fa-eye mr-2"></i>View Topics
                            </button>
                            <button
                                @click="addTopicToSubject(subject)"
                                class="flex-1 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                <i class="fas fa-plus mr-2"></i>Add Topic
                            </button>
                        </div>
                    </div>

                    <!-- Topics Preview -->
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-900 flex items-center">
                                <i class="fas fa-list mr-2 text-gray-500"></i>
                                Recent Topics
                            </h4>
                            <span class="text-xs text-gray-500">{{ (subjectTopics[subject.id] || []).length }} total</span>
                        </div>
                        
                        <!-- Topics List -->
                        <div v-if="(subjectTopics[subject.id] || []).length === 0" class="text-center py-8">
                            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-file-alt text-gray-400"></i>
                            </div>
                            <p class="text-sm text-gray-500 mb-3">No topics yet</p>
                            <button
                                @click="addTopicToSubject(subject)"
                                class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                Add your first topic →
                            </button>
                        </div>
                        
                        <div v-else class="space-y-3">
                            <div
                                v-for="topic in (subjectTopics[subject.id] || []).slice(0, 3)"
                                :key="topic.id"
                                @click="startTopicPractice(subject, topic)"
                                class="group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <h5 class="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{{ topic.name }}</h5>
                                        <p class="text-xs text-gray-500 mt-1">{{ topic.description || 'No description' }}</p>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-xs text-gray-400">{{ questionCounts[topic.id] || 0 }} questions</span>
                                        <i class="fas fa-chevron-right text-gray-400 text-xs group-hover:text-primary-600 transition-colors"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Show more topics link -->
                            <div v-if="(subjectTopics[subject.id] || []).length > 3" class="pt-2 border-t border-gray-200">
                                <button
                                    @click="viewSubjectTopics(subject)"
                                    class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    View all {{ (subjectTopics[subject.id] || []).length }} topics →
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Subject Footer -->
                    <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <span class="flex items-center">
                                <i class="fas fa-calendar mr-1"></i>
                                Created {{ formatDate(subject.created_at) }}
                            </span>
                            <div class="flex items-center space-x-4">
                                <span class="flex items-center">
                                    <i class="fas fa-upload mr-1"></i>
                                    {{ noteCounts[subject.id] || 0 }} files
                                </span>
                                <span class="flex items-center">
                                    <div class="w-2 h-2 bg-accent-500 rounded-full mr-1"></div>
                                    Active
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
        const subjectTopics = Vue.ref({});
        const topicCounts = Vue.ref({});
        const questionCounts = Vue.ref({});
        const noteCounts = Vue.ref({});

        const totalTopics = Vue.computed(() => {
            return Object.values(topicCounts.value).reduce((sum, count) => sum + count, 0);
        });

        const totalQuestions = Vue.computed(() => {
            return Object.values(questionCounts.value).reduce((sum, count) => sum + count, 0);
        });

        const loadSubjectData = async () => {
            for (const subject of store.state.subjects) {
                try {
                    // Load topics for this subject
                    const topics = await window.api.getTopics(subject.id);
                    subjectTopics.value[subject.id] = topics;
                    topicCounts.value[subject.id] = topics.length;

                    // Load question counts for each topic
                    for (const topic of topics) {
                        try {
                            const questions = await window.api.getQuestions(topic.id);
                            questionCounts.value[topic.id] = questions.length;
                        } catch (error) {
                            questionCounts.value[topic.id] = 0;
                        }
                    }

                    // Load note counts (placeholder for now)
                    noteCounts.value[subject.id] = Math.floor(Math.random() * 5); // Replace with actual API call

                } catch (error) {
                    console.warn(`Failed to load data for subject ${subject.id}:`, error);
                    subjectTopics.value[subject.id] = [];
                    topicCounts.value[subject.id] = 0;
                }
            }
        };

        const loadSubjects = async () => {
            isLoading.value = true;
            try {
                const subjects = await window.api.getSubjects();
                if (subjects && Array.isArray(subjects)) {
                    store.setSubjects(subjects);
                    await loadSubjectData();
                }
            } catch (error) {
                console.error('Failed to load subjects:', error);
                store.showNotification('Failed to load subjects', 'error');
            } finally {
                isLoading.value = false;
            }
        };

        const viewSubjectTopics = (subject) => {
            store.selectSubject(subject);
        };

        const addTopicToSubject = (subject) => {
            store.selectSubject(subject);
            store.showCreateTopicModal();
        };

        const startTopicPractice = (subject, topic) => {
            store.selectSubject(subject);
            store.selectTopic(topic);
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                return new Date(dateString).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
            } catch (error) {
                return 'Invalid date';
            }
        };

        // Load data when component mounts
        Vue.onMounted(async () => {
            await loadSubjects();
        });

        // Watch for subjects changes
        Vue.watch(() => store.state.subjects, async () => {
            await loadSubjectData();
        }, { deep: true });

        return {
            store,
            isLoading,
            subjectTopics,
            topicCounts,
            questionCounts,
            noteCounts,
            totalTopics,
            totalQuestions,
            viewSubjectTopics,
            addTopicToSubject,
            startTopicPractice,
            formatDate
        };
    }
};