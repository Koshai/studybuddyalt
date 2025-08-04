// components/Practice/BrowsePracticeTopics.js - Browse All Practice Topics by Subject
window.BrowsePracticeTopicsComponent = {
    template: `
    <div class="animate-fade-in max-w-6xl mx-auto p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Browse Practice Topics</h1>
                <p class="text-gray-600">All topics with questions organized by subject</p>
            </div>
            <button 
                @click="backToPractice"
                class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <i class="fas fa-arrow-left mr-2"></i>Back to Practice
            </button>
        </div>

        <!-- Search and Filter -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div class="flex flex-col md:flex-row gap-4">
                <!-- Search -->
                <div class="flex-1">
                    <div class="relative">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search topics..."
                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <!-- Subject Filter -->
                <div class="md:w-64">
                    <select
                        v-model="selectedSubjectFilter"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                        <option value="">All Subjects</option>
                        <option v-for="subject in availableSubjects" :key="subject.id" :value="subject.id">
                            {{ subject.name }}
                        </option>
                    </select>
                </div>

                <!-- Sort -->
                <div class="md:w-48">
                    <select
                        v-model="sortBy"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="questions">Most Questions</option>
                        <option value="score">Best Score</option>
                        <option value="recent">Recently Practiced</option>
                    </select>
                </div>
            </div>

            <!-- Stats Summary -->
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-primary-600">{{ filteredTopics.length }}</div>
                        <div class="text-xs text-gray-600">Topics</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-green-600">{{ totalQuestions }}</div>
                        <div class="text-xs text-gray-600">Questions</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-blue-600">{{ uniqueSubjects }}</div>
                        <div class="text-xs text-gray-600">Subjects</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-purple-600">{{ averageScore }}%</div>
                        <div class="text-xs text-gray-600">Avg Score</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Loading Topics...</h3>
            <p class="text-gray-600">Organizing your practice topics</p>
        </div>

        <!-- No Topics -->
        <div v-else-if="filteredTopics.length === 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-search text-gray-400 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No Topics Found</h3>
            <p class="text-gray-600 mb-4">
                {{ searchQuery || selectedSubjectFilter ? 'Try adjusting your search or filter' : 'No practice topics available yet' }}
            </p>
            <button 
                v-if="searchQuery || selectedSubjectFilter"
                @click="clearFilters"
                class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
                Clear Filters
            </button>
        </div>

        <!-- Topics by Subject -->
        <div v-else class="space-y-8">
            <div v-for="subject in groupedTopics" :key="subject.id" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Subject Header -->
                <div class="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-gray-100">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                                 :class="subject.color || 'bg-primary-500'">
                                <i :class="subject.icon || 'fas fa-book'" class="text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-gray-900">{{ subject.name }}</h2>
                                <p class="text-sm text-gray-600">{{ subject.topics.length }} topics • {{ subject.totalQuestions }} questions</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-primary-600">{{ subject.averageScore }}%</div>
                            <div class="text-xs text-gray-500">Avg Score</div>
                        </div>
                    </div>
                </div>

                <!-- Topics List -->
                <div class="p-6">
                    <div class="grid gap-4">
                        <div
                            v-for="topic in subject.topics"
                            :key="topic.id"
                            @click="startPractice(topic)"
                            class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-50 to-white"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-900 mb-1">{{ topic.name }}</h4>
                                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>
                                            <i class="fas fa-question-circle mr-1"></i>
                                            {{ topic.questionCount }} questions
                                        </span>
                                        <span>
                                            <i class="fas fa-file-alt mr-1"></i>
                                            {{ topic.notesCount }} files
                                        </span>
                                        <span>
                                            <i class="fas fa-clock mr-1"></i>
                                            {{ formatTimeAgo(topic.lastPracticed) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="text-right ml-4">
                                    <div class="text-lg font-bold text-primary-600">{{ topic.bestScore || 0 }}%</div>
                                    <div class="text-xs text-gray-500">Best</div>
                                </div>
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
        
        // State
        const loading = Vue.ref(true);
        const allTopics = Vue.ref([]);
        const searchQuery = Vue.ref('');
        const selectedSubjectFilter = Vue.ref('');
        const sortBy = Vue.ref('name');

        // Computed
        const availableSubjects = Vue.computed(() => {
            const subjectIds = [...new Set(allTopics.value.map(t => t.subjectId))];
            return store.state.subjects.filter(s => subjectIds.includes(s.id));
        });

        const filteredTopics = Vue.computed(() => {
            let topics = allTopics.value;

            // Apply search filter
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase();
                topics = topics.filter(topic => 
                    topic.name.toLowerCase().includes(query) ||
                    topic.subjectName.toLowerCase().includes(query)
                );
            }

            // Apply subject filter
            if (selectedSubjectFilter.value) {
                topics = topics.filter(topic => topic.subjectId === selectedSubjectFilter.value);
            }

            // Apply sorting
            topics.sort((a, b) => {
                switch (sortBy.value) {
                    case 'questions':
                        return b.questionCount - a.questionCount;
                    case 'score':
                        return (b.bestScore || 0) - (a.bestScore || 0);
                    case 'recent':
                        if (!a.lastPracticed && !b.lastPracticed) return 0;
                        if (!a.lastPracticed) return 1;
                        if (!b.lastPracticed) return -1;
                        return new Date(b.lastPracticed) - new Date(a.lastPracticed);
                    default: // name
                        return a.name.localeCompare(b.name);
                }
            });

            return topics;
        });

        const groupedTopics = Vue.computed(() => {
            const groups = {};
            
            filteredTopics.value.forEach(topic => {
                const subject = store.getSubjectById(topic.subjectId);
                if (!subject) return;

                if (!groups[subject.id]) {
                    groups[subject.id] = {
                        ...subject,
                        topics: [],
                        totalQuestions: 0,
                        totalScore: 0,
                        practiceCount: 0
                    };
                }

                groups[subject.id].topics.push(topic);
                groups[subject.id].totalQuestions += topic.questionCount;
                
                if (topic.bestScore > 0) {
                    groups[subject.id].totalScore += topic.bestScore;
                    groups[subject.id].practiceCount++;
                }
            });

            // Calculate average scores and sort
            return Object.values(groups).map(subject => ({
                ...subject,
                averageScore: subject.practiceCount > 0 
                    ? Math.round(subject.totalScore / subject.practiceCount) 
                    : 0
            })).sort((a, b) => a.name.localeCompare(b.name));
        });

        const totalQuestions = Vue.computed(() => 
            filteredTopics.value.reduce((sum, topic) => sum + topic.questionCount, 0)
        );

        const uniqueSubjects = Vue.computed(() => 
            new Set(filteredTopics.value.map(t => t.subjectId)).size
        );

        const averageScore = Vue.computed(() => {
            const topicsWithScores = filteredTopics.value.filter(t => t.bestScore > 0);
            if (topicsWithScores.length === 0) return 0;
            return Math.round(topicsWithScores.reduce((sum, t) => sum + t.bestScore, 0) / topicsWithScores.length);
        });

        // Methods
        const loadPracticeTopics = async () => {
            try {
                loading.value = true;
                const topics = await window.api.getTopicsWithQuestions();
                
                allTopics.value = topics.map(topic => ({
                    ...topic,
                    subjectName: store.getSubjectById(topic.subjectId)?.name || 'Unknown'
                }));
                
            } catch (error) {
                console.error('Failed to load practice topics:', error);
                store.showNotification('Failed to load practice topics', 'error');
            } finally {
                loading.value = false;
            }
        };

        const startPractice = (topic) => {
            store.selectSubject(store.getSubjectById(topic.subjectId));
            store.selectTopic(topic);
            store.setCurrentView('practice-session');
        };

        const backToPractice = () => {
            store.setCurrentView('practice');
        };

        const clearFilters = () => {
            searchQuery.value = '';
            selectedSubjectFilter.value = '';
        };

        const formatTimeAgo = (dateString) => {
            if (!dateString || dateString === 'Never') return 'never';
            
            const now = new Date();
            const date = new Date(dateString);
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'today';
            if (diffDays === 1) return 'yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return `${Math.floor(diffDays / 30)} months ago`;
        };

        // Lifecycle
        Vue.onMounted(loadPracticeTopics);

        return {
            store,
            loading,
            searchQuery,
            selectedSubjectFilter,
            sortBy,
            availableSubjects,
            filteredTopics,
            groupedTopics,
            totalQuestions,
            uniqueSubjects,
            averageScore,
            startPractice,
            backToPractice,
            clearFilters,
            formatTimeAgo
        };
    }
};