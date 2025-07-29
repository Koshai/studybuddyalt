// components/Dashboard/Dashboard-simplified.js
window.SimplifiedDashboardComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
        <!-- Welcome Header -->
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-black mb-4">
                <span class="mr-3">🧠</span>Welcome to StudyAI
            </h2>
            <p class="text-black/80 text-lg">Your intelligent learning companion - Choose subjects, create topics, and practice with AI-generated questions!</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-black">{{ stats.totalTopics }}</div>
                <div class="text-black/70 text-sm">Your Topics</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-black">{{ stats.totalQuestions }}</div>
                <div class="text-black/70 text-sm">Questions</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-black">{{ stats.totalNotes }}</div>
                <div class="text-black/70 text-sm">Study Files</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-black">{{ stats.overallAccuracy }}%</div>
                <div class="text-black/70 text-sm">Accuracy</div>
            </div>
        </div>

        <!-- Fixed Subjects Grid -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-gray-900 flex items-center">
                    <i class="fas fa-graduation-cap mr-3 text-primary-600"></i>
                    Choose Your Subject
                    <span class="ml-3 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ store.state.subjects.length }} Available</span>
                </h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div
                    v-for="subject in store.state.subjects"
                    :key="subject.id"
                    @click="selectSubject(subject)"
                    class="group p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-lg cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-50 to-white"
                >
                    <div class="text-center">
                        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white group-hover:scale-110 transition-transform', subject.color]">
                            <i :class="subject.icon" class="text-xl"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors text-sm">
                            {{ subject.name }}
                        </h4>
                        <p class="text-xs text-gray-600 leading-tight">
                            {{ subject.description }}
                        </p>
                        
                        <!-- Subject Stats -->
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex justify-between text-xs text-gray-500">
                                <span>{{ getSubjectTopicCount(subject.id) }} topics</span>
                                <span class="text-accent-600 font-medium">→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i class="fas fa-rocket mr-3 text-primary-600"></i>
                Quick Actions
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Upload Materials -->
                <button
                    @click="goToUpload"
                    class="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 text-left border border-blue-200 hover:border-blue-300"
                >
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <i class="fas fa-upload text-xl"></i>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2">Upload Study Materials</h4>
                    <p class="text-sm text-gray-600">Add notes, PDFs, and documents to generate questions</p>
                </button>
                
                <!-- Practice Questions -->
                <button
                    @click="goToPractice"
                    :disabled="!canPractice"
                    :class="[
                        'group p-6 rounded-xl transition-all duration-300 text-left border',
                        canPractice 
                            ? 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 hover:border-green-300' 
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75'
                    ]"
                >
                    <div class="flex items-center mb-4">
                        <div :class="[
                            'w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform',
                            canPractice ? 'bg-green-500 group-hover:scale-110' : 'bg-gray-400'
                        ]">
                            <i class="fas fa-brain text-xl"></i>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2">Practice Questions</h4>
                    <p class="text-sm text-gray-600">
                        {{ canPractice ? 'Start practicing with your generated questions' : 'Create topics and upload materials first' }}
                    </p>
                </button>

                <!-- Browse Subjects -->
                <button
                    @click="goToSubjects"
                    class="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 text-left border border-purple-200 hover:border-purple-300"
                >
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <i class="fas fa-book text-xl"></i>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2">Browse Subjects</h4>
                    <p class="text-sm text-gray-600">Explore all subjects and manage your topics</p>
                </button>
            </div>
        </div>

        <!-- Recent Activity -->
        <div v-if="recentActivity.length > 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-gray-900 flex items-center">
                    <i class="fas fa-clock mr-3 text-orange-600"></i>
                    Recent Activity
                </h3>
                <span class="text-sm text-gray-500">Last {{ recentActivity.length }} activities</span>
            </div>
            
            <div class="space-y-3">
                <div
                    v-for="activity in recentActivity.slice(0, 5)"
                    :key="activity.id"
                    class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <div :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm',
                        getActivityIconClass(activity.type)
                    ]">
                        <i :class="getActivityIcon(activity.type)"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ activity.title }}</p>
                        <p class="text-xs text-gray-500">{{ activity.topic_name }} • {{ getSubjectName(activity.subject_id) }}</p>
                    </div>
                    <div class="text-xs text-gray-400">
                        {{ formatTimeAgo(activity.created_at) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- AI Status -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <i class="fas fa-microchip mr-3 text-purple-600"></i>
                AI System Status
            </h3>
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <div :class="[
                        'w-3 h-3 rounded-full mr-3',
                        store.state.aiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    ]"></div>
                    <span class="font-medium text-gray-900">Ollama AI Service</span>
                </div>
                <span :class="[
                    'text-sm font-medium px-3 py-1 rounded-full',
                    store.state.aiOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                    {{ store.state.aiOnline ? 'Online & Ready' : 'Offline' }}
                </span>
            </div>
            
            <div v-if="!store.state.aiOnline" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    AI service is offline. Start Ollama to generate questions.
                </p>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const stats = Vue.ref({
            totalTopics: 0,
            totalQuestions: 0,
            totalNotes: 0,
            overallAccuracy: 0
        });
        const subjectTopicCounts = Vue.ref({});
        const recentActivity = Vue.ref([]);

        // Load dashboard data
        const loadDashboardData = async () => {
        try {
            store.setLoading(true);
            console.log('🔄 Loading dashboard data...');
            
            // Load statistics with better error handling
            try {
            const dashboardStats = await window.api.getDashboardStats();
            console.log('📊 Dashboard stats received:', dashboardStats);
            
            stats.value = {
                totalTopics: dashboardStats.total_topics || 0,
                totalQuestions: dashboardStats.total_questions || 0,
                totalNotes: dashboardStats.total_notes || 0,
                overallAccuracy: dashboardStats.overall_accuracy || 0
            };
            
            console.log('📊 Processed stats:', stats.value);
            } catch (error) {
            console.error('❌ Failed to load dashboard stats:', error);
            // Set default values
            stats.value = {
                totalTopics: 0,
                totalQuestions: 0,
                totalNotes: 0,
                overallAccuracy: 0
            };
            }

            // Load subject-wise topic counts with better debugging
            try {
            console.log('🔄 Loading subject stats...');
            const subjectStats = await window.api.getSubjectStats();
            console.log('📊 Subject stats received:', subjectStats);
            
            // Reset the counts object
            subjectTopicCounts.value = {};
            
            subjectStats.forEach(stat => {
                if (stat.subject && stat.subject.id) {
                subjectTopicCounts.value[stat.subject.id] = stat.topic_count;
                console.log(`📊 Subject ${stat.subject.name}: ${stat.topic_count} topics`);
                }
            });
            
            console.log('📊 Final topic counts:', subjectTopicCounts.value);
            } catch (error) {
            console.error('❌ Failed to load subject stats:', error);
            // Initialize empty counts for all subjects
            store.state.subjects.forEach(subject => {
                subjectTopicCounts.value[subject.id] = 0;
            });
            }

            // Load recent activity
            try {
            const activity = await window.api.getRecentActivity(10);
            recentActivity.value = activity;
            console.log('📋 Recent activity loaded:', activity.length, 'items');
            } catch (error) {
            console.error('❌ Failed to load recent activity:', error);
            recentActivity.value = [];
            }

        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            store.showNotification('Failed to load dashboard data: ' + error.message, 'error');
        } finally {
            store.setLoading(false);
        }
        };

        // Get topic count for a subject
        const getSubjectTopicCount = (subjectId) => {
            return subjectTopicCounts.value[subjectId] || 0;
        };

        // Get subject name by ID
        const getSubjectName = (subjectId) => {
            const subject = store.getSubjectById(subjectId);
            return subject ? subject.name : 'Unknown';
        };

        // Navigate functions
        const selectSubject = (subject) => {
            store.selectSubject(subject);
            store.setCurrentView('subjects');
        };

        const goToUpload = () => {
            store.setCurrentView('upload');
        };

        const goToPractice = () => {
            if (canPractice.value) {
                store.setCurrentView('practice');
            } else {
                store.showNotification('Create topics and add study materials first!', 'info');
            }
        };

        const goToSubjects = () => {
            store.setCurrentView('subjects');
        };

        // Can practice check
        const canPractice = Vue.computed(() => {
            return stats.value.totalQuestions > 0;
        });

        // Activity helpers
        const getActivityIcon = (type) => {
            const icons = {
                question: 'fas fa-question-circle',
                note: 'fas fa-file-text',
                practice: 'fas fa-brain',
                topic: 'fas fa-plus-circle'
            };
            return icons[type] || 'fas fa-circle';
        };

        const getActivityIconClass = (type) => {
            const classes = {
                question: 'bg-blue-500',
                note: 'bg-green-500',
                practice: 'bg-purple-500',
                topic: 'bg-orange-500'
            };
            return classes[type] || 'bg-gray-500';
        };

        const formatTimeAgo = (dateString) => {
            if (!dateString) return '';
            
            const now = new Date();
            const date = new Date(dateString);
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            
            return date.toLocaleDateString();
        };

        // Load data on mount
        Vue.onMounted(async () => {
            await loadDashboardData();
        });

        return {
            store,
            stats,
            recentActivity,
            getSubjectTopicCount,
            getSubjectName,
            selectSubject,
            goToUpload,
            goToPractice,
            goToSubjects,
            canPractice,
            getActivityIcon,
            getActivityIconClass,
            formatTimeAgo
        };
    }
};