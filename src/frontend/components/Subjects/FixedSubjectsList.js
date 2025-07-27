// components/Subjects/FixedSubjectsList.js - Simplified Subjects Display
window.FixedSubjectsListComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
        <!-- Header -->
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
                <span class="mr-3">📚</span>Choose Your Study Subject
            </h2>
            <p class="text-white/80 text-lg">Select a subject area to organize your learning and create topics</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ stats.totalTopics }}</div>
                <div class="text-white/70 text-sm">Your Topics</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ stats.totalQuestions }}</div>
                <div class="text-white/70 text-sm">Questions</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ stats.totalNotes }}</div>
                <div class="text-white/70 text-sm">Study Files</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ stats.overallAccuracy }}%</div>
                <div class="text-white/70 text-sm">Accuracy</div>
            </div>
        </div>

        <!-- Fixed Subjects Grid -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-gray-900 flex items-center">
                    <i class="fas fa-graduation-cap mr-3 text-primary-600"></i>
                    Study Subjects
                    <span class="ml-3 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ subjects.length }} Available</span>
                </h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div
                    v-for="subject in subjects"
                    :key="subject.id"
                    @click="selectSubject(subject)"
                    class="group p-6 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-lg cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-50 to-white"
                >
                    <div class="text-center">
                        <div :class="['w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform text-2xl', subject.color]">
                            <i :class="subject.icon"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors text-sm">
                            {{ subject.name }}
                        </h4>
                        <p class="text-xs text-gray-600 leading-tight mb-3">
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

        <!-- Getting Started Help -->
        <div v-if="!hasAnyTopics" class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div class="text-4xl mb-4">🎯</div>
            <h3 class="text-xl font-bold text-white mb-4">Ready to Start Learning?</h3>
            <p class="text-white/80 mb-6">Choose a subject above to create your first topic and begin uploading study materials!</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div class="bg-white/20 rounded-lg p-4">
                    <div class="text-2xl mb-2">📚</div>
                    <p class="text-white text-sm">Choose Subject</p>
                </div>
                <div class="bg-white/20 rounded-lg p-4">
                    <div class="text-2xl mb-2">📝</div>
                    <p class="text-white text-sm">Create Topics</p>
                </div>
                <div class="bg-white/20 rounded-lg p-4">
                    <div class="text-2xl mb-2">🤖</div>
                    <p class="text-white text-sm">Generate Questions</p>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const subjectTopicCounts = Vue.ref({});
        const stats = Vue.ref({
            totalTopics: 0,
            totalQuestions: 0,
            totalNotes: 0,
            overallAccuracy: 0
        });

        // Get fixed subjects from store
        const subjects = Vue.computed(() => store.state.subjects);

        const hasAnyTopics = Vue.computed(() => {
            return Object.values(subjectTopicCounts.value).some(count => count > 0);
        });

        const loadDashboardData = async () => {
            try {
                store.setLoading(true);
                
                // Load statistics
                const dashboardStats = await window.api.getDashboardStats();
                stats.value = {
                    totalTopics: dashboardStats.total_topics || 0,
                    totalQuestions: dashboardStats.total_questions || 0,
                    totalNotes: dashboardStats.total_notes || 0,
                    overallAccuracy: dashboardStats.overall_accuracy || 0
                };

                // Load subject-wise topic counts
                const subjectStats = await window.api.getSubjectStats();
                subjectStats.forEach(stat => {
                    subjectTopicCounts.value[stat.subject.id] = stat.topic_count;
                });

                console.log('Dashboard data loaded:', { stats: stats.value });

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                store.showNotification('Failed to load dashboard data', 'error');
            } finally {
                store.setLoading(false);
            }
        };

        // Get topic count for a subject
        const getSubjectTopicCount = (subjectId) => {
            return subjectTopicCounts.value[subjectId] || 0;
        };

        // Navigate to subject topics
        const selectSubject = (subject) => {
            console.log('Selected subject:', subject);
            store.selectSubject(subject);
            store.setCurrentView('topics'); // New view for topics list
        };

        // Load data on mount
        Vue.onMounted(async () => {
            await loadDashboardData();
        });

        return {
            store,
            subjects,
            stats,
            hasAnyTopics,
            subjectTopicCounts,
            getSubjectTopicCount,
            selectSubject
        };
    }
};