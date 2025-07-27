// components/Layout/Sidebar-simplified.js - Simplified Sidebar without Subject Creation
window.SidebarSimplifiedComponent = {
    template: `
    <div :class="['transition-all duration-300 bg-gray-900', store.state.sidebarOpen ? 'w-64' : 'w-16']" class="h-full border-r border-gray-700">
        <div class="p-4">
            <!-- Logo -->
            <div class="flex items-center space-x-3 mb-8">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    AI
                </div>
                <div v-if="store.state.sidebarOpen" class="animate-fade-in">
                    <h1 class="text-xl font-bold text-white">StudyAI</h1>
                    <p class="text-xs text-gray-300">Intelligent Learning</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="space-y-2">
                <button
                    @click="store.setCurrentView('dashboard')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'dashboard' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-chart-line w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Dashboard</span>
                </button>
                
                <button
                    @click="store.setCurrentView('subjects')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        ['subjects', 'topics'].includes(store.state.currentView)
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-book w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Subjects</span>
                </button>
                
                <button
                    @click="store.setCurrentView('upload')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'upload' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-upload w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Upload</span>
                </button>
                
                <button
                    @click="store.setCurrentView('practice')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'practice' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-brain w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Practice</span>
                </button>
            </nav>

            <!-- Statistics (when sidebar is open) -->
            <div v-if="store.state.sidebarOpen && hasData" class="mt-8 pt-4 border-t border-gray-700">
                <div class="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Quick Stats</div>
                <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Topics</span>
                        <span class="text-white font-medium">{{ stats.totalTopics }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Questions</span>
                        <span class="text-white font-medium">{{ stats.totalQuestions }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Study Files</span>
                        <span class="text-white font-medium">{{ stats.totalNotes }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Accuracy</span>
                        <span class="text-accent-400 font-bold">{{ stats.overallAccuracy }}%</span>
                    </div>
                </div>
            </div>

            <!-- Quick Actions (when sidebar is open) -->
            <div v-if="store.state.sidebarOpen" class="mt-6 space-y-2">
                <div class="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Quick Actions</div>
                
                <!-- Add Topic (only if subject is selected) -->
                <button
                    v-if="store.state.selectedSubject"
                    @click="store.showCreateTopicModal()"
                    class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                    <i class="fas fa-plus w-4"></i>
                    <span>Add Topic</span>
                </button>
                
                <!-- Upload Materials -->
                <button
                    @click="store.setCurrentView('upload')"
                    class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                    <i class="fas fa-cloud-upload w-4"></i>
                    <span>Upload File</span>
                </button>
                
                <!-- Generate Questions (only if topic is selected) -->
                <button
                    v-if="store.state.selectedTopic"
                    @click="generateQuestions"
                    :disabled="store.state.generating"
                    class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                    <i :class="store.state.generating ? 'fas fa-spinner fa-spin w-4' : 'fas fa-magic w-4'"></i>
                    <span>{{ store.state.generating ? 'Generating...' : 'Generate Questions' }}</span>
                </button>
            </div>

            <!-- User Profile Section (when sidebar is open) -->
            <div v-if="store.state.sidebarOpen" class="absolute bottom-4 left-4 right-4">
                <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-white truncate">Learner</p>
                            <p class="text-xs text-gray-400">{{ getStatusText() }}</p>
                        </div>
                        <div class="flex items-center">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                store.state.aiOnline ? 'bg-green-400' : 'bg-red-400'
                            ]" :title="store.state.aiOnline ? 'AI Online' : 'AI Offline'"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Toggle -->
        <button
            @click="store.toggleSidebar()"
            class="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all duration-200 border border-gray-200"
        >
            <i :class="store.state.sidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'" class="text-xs"></i>
        </button>
    </div>
    `,
    
    setup() {
        const store = window.store;
        
        // Computed stats for sidebar display
        const stats = Vue.computed(() => ({
            totalTopics: store.state.statistics?.totalTopics || 0,
            totalQuestions: store.state.statistics?.totalQuestions || 0,
            totalNotes: store.state.statistics?.totalNotes || 0,
            overallAccuracy: store.state.statistics?.overallAccuracy || 0
        }));

        const hasData = Vue.computed(() => {
            return stats.value.totalTopics > 0 || stats.value.totalQuestions > 0 || stats.value.totalNotes > 0;
        });

        const getStatusText = () => {
            if (store.state.generating) return 'Generating...';
            if (store.state.practiceStarted) return 'In Practice';
            if (store.state.selectedTopic) return 'Topic Selected';
            if (store.state.selectedSubject) return 'Subject Selected';
            return 'Ready to Learn';
        };

        const generateQuestions = async () => {
            if (!store.state.selectedTopic || store.state.generating) return;

            try {
                store.setGenerating(true);
                
                const questions = await window.api.generateQuestions(
                    store.state.selectedTopic.id,
                    5,
                    store.state.selectedSubject,
                    store.state.selectedTopic
                );
                
                if (questions.length > 0) {
                    store.showNotification(`Generated ${questions.length} questions!`, 'success');
                } else {
                    store.showNotification('No questions generated. Upload study materials first.', 'warning');
                }
            } catch (error) {
                store.showNotification('Failed to generate questions', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        // Load stats when component mounts
        Vue.onMounted(async () => {
            try {
                const dashboardStats = await window.api.getDashboardStats();
                store.setStatistics(dashboardStats);
            } catch (error) {
                console.warn('Failed to load sidebar stats:', error);
            }
        });

        return {
            store,
            stats,
            hasData,
            getStatusText,
            generateQuestions
        };
    }
};