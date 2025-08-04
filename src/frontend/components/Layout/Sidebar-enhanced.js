// components/Layout/Sidebar-enhanced.js - Sidebar with Subscription Info
window.EnhancedSidebarComponent = {
    template: `
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
        <!-- Logo/Brand -->
        <div class="p-6 border-b border-gray-200">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <i class="fas fa-brain text-white text-lg"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-gray-900">StudyAI</h1>
                    <p class="text-xs text-gray-600">AI-Powered Learning</p>
                </div>
            </div>
        </div>

        <!-- User Info Section -->
        <div v-if="store.state.isAuthenticated" class="p-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-sm">{{ getUserInitials }}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ store.state.user?.firstName }} {{ store.state.user?.lastName }}</p>
                    <div class="flex items-center space-x-2">
                        <span :class="[
                            'px-2 py-1 text-xs font-medium rounded-full',
                            store.state.subscriptionTier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        ]">
                            {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}
                        </span>
                        <button v-if="store.state.subscriptionTier === 'free'" 
                                @click="showUpgradeModal" 
                                class="text-xs text-purple-600 hover:text-purple-800 underline">
                            Upgrade
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Usage Overview -->
        <div v-if="store.state.isAuthenticated" class="p-4 border-b border-gray-200">
            <h4 class="text-xs font-semibold text-gray-700 mb-3">USAGE THIS MONTH</h4>
            <div class="space-y-3">
                <!-- Questions -->
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-600">Questions</span>
                        <span class="font-medium" :class="questionsUsagePercentage > 80 ? 'text-red-600' : 'text-gray-900'">
                            {{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1">
                        <div class="h-1 rounded-full transition-all duration-300" 
                             :class="questionsUsagePercentage > 90 ? 'bg-red-500' : questionsUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'"
                             :style="{ width: questionsUsagePercentage + '%' }"></div>
                    </div>
                </div>
                
                <!-- Storage -->
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-600">Storage</span>
                        <span class="font-medium" :class="storageUsagePercentage > 80 ? 'text-red-600' : 'text-gray-900'">
                            {{ storageUsedMB }}MB/{{ storageUsageLimitMB }}MB
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1">
                        <div class="h-1 rounded-full transition-all duration-300" 
                             :class="storageUsagePercentage > 90 ? 'bg-red-500' : storageUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'"
                             :style="{ width: storageUsagePercentage + '%' }"></div>
                    </div>
                </div>
                
                <!-- Topics -->
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-600">Topics</span>
                        <span class="font-medium" :class="topicsUsagePercentage >= 100 ? 'text-red-600' : 'text-gray-900'">
                            {{ store.state.usage?.topics?.used || 0 }}/{{ store.state.usage?.topics?.limit || 3 }}
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1">
                        <div class="h-1 rounded-full transition-all duration-300" 
                             :class="topicsUsagePercentage >= 100 ? 'bg-red-500' : topicsUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-purple-500'"
                             :style="{ width: topicsUsagePercentage + '%' }"></div>
                    </div>
                </div>
            </div>
            
            <!-- Upgrade CTA -->
            <div v-if="store.state.subscriptionTier === 'free' && hasUsageWarnings" class="mt-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <p class="text-xs text-purple-800 font-medium mb-1">Running low on usage?</p>
                <button @click="showUpgradeModal" 
                        class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:shadow-sm transition-all duration-300">
                    Upgrade to Pro
                </button>
            </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 p-4">
            <div class="space-y-2">
                <!-- Dashboard -->
                <button
                    @click="setCurrentView('dashboard')"
                    :class="[
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                        store.state.currentView === 'dashboard' 
                            ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                            : 'text-gray-700 hover:bg-gray-100'
                    ]"
                >
                    <i class="fas fa-home w-4"></i>
                    <span class="font-medium">Dashboard</span>
                </button>

                <!-- Subjects -->
                <button
                    @click="setCurrentView('subjects')"
                    :class="[
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                        store.state.currentView === 'subjects' 
                            ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                            : 'text-gray-700 hover:bg-gray-100'
                    ]"
                >
                    <i class="fas fa-book w-4"></i>
                    <span class="font-medium">Subjects</span>
                    <span v-if="store.state.statistics?.totalTopics > 0" class="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {{ store.state.statistics.totalTopics }}
                    </span>
                </button>

                <!-- Upload -->
                <button
                    @click="handleUploadClick"
                    :disabled="!canUpload"
                    :class="[
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                        store.state.currentView === 'upload' 
                            ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                            : canUpload 
                                ? 'text-gray-700 hover:bg-gray-100' 
                                : 'text-gray-400 cursor-not-allowed'
                    ]"
                >
                    <i class="fas fa-upload w-4"></i>
                    <span class="font-medium">Upload Materials</span>
                    <div class="ml-auto flex items-center space-x-1">
                        <span v-if="store.state.statistics?.totalNotes > 0" class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {{ store.state.statistics.totalNotes }}
                        </span>
                        <i v-if="!canUpload" class="fas fa-exclamation-triangle text-red-500 text-xs" title="Storage limit reached"></i>
                    </div>
                </button>

                <!-- Practice -->
                <button
                    @click="handlePracticeClick"
                    :disabled="!canPractice"
                    :class="[
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                        store.state.currentView === 'practice' 
                            ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                            : canPractice 
                                ? 'text-gray-700 hover:bg-gray-100' 
                                : 'text-gray-400 cursor-not-allowed'
                    ]"
                >
                    <i class="fas fa-brain w-4"></i>
                    <span class="font-medium">Practice</span>
                    <div class="ml-auto flex items-center space-x-1">
                        <span v-if="store.state.statistics?.totalQuestions > 0" class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {{ store.state.statistics.totalQuestions }}
                        </span>
                        <i v-if="!canGenerate && canPractice" class="fas fa-exclamation-triangle text-yellow-500 text-xs" title="Question limit reached"></i>
                    </div>
                </button>

                <!-- Notes Management -->
                <button
                    @click="setCurrentView('notes')"
                    :class="[
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                        store.state.currentView === 'notes' 
                            ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                            : 'text-gray-700 hover:bg-gray-100'
                    ]"
                >
                    <i class="fas fa-file-text w-4"></i>
                    <span class="font-medium">Study Materials</span>
                    <div class="ml-auto flex items-center space-x-1">
                        <span v-if="store.state.statistics?.totalNotes > 0" class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {{ store.state.statistics.totalNotes }}
                        </span>
                    </div>
                </button>
            </div>

            <!-- Quick Actions -->
            <div class="mt-8">
                <h4 class="text-xs font-semibold text-gray-700 mb-3">QUICK ACTIONS</h4>
                <div class="space-y-2">
                    <!-- Generate Questions -->
                    <button
                        @click="handleGenerateClick"
                        :disabled="!canGenerate"
                        :class="[
                            'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                            canGenerate 
                                ? 'text-gray-600 hover:bg-gray-100' 
                                : 'text-gray-400 cursor-not-allowed'
                        ]"
                    >
                        <i class="fas fa-magic w-4"></i>
                        <span>Generate Questions</span>
                        <i v-if="!canGenerate" class="fas fa-lock text-red-500 text-xs ml-auto" title="Question limit reached"></i>
                    </button>

                    <!-- Add Topic -->
                    <button
                        @click="handleAddTopicClick"
                        :disabled="!canCreateTopic"
                        :class="[
                            'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                            canCreateTopic 
                                ? 'text-gray-600 hover:bg-gray-100' 
                                : 'text-gray-400 cursor-not-allowed'
                        ]"
                    >
                        <i class="fas fa-plus w-4"></i>
                        <span>Add Topic</span>
                        <i v-if="!canCreateTopic" class="fas fa-lock text-red-500 text-xs ml-auto" title="Topic limit reached"></i>
                    </button>

                    <!-- Export Data -->
                    <button
                        @click="exportData"
                        class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <i class="fas fa-download w-4"></i>
                        <span>Export Data</span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- AI Status Footer -->
        <div class="p-4 border-t border-gray-200">
            <div class="flex items-center justify-between text-sm">
                <div class="flex items-center space-x-2">
                    <div :class="[
                        'w-2 h-2 rounded-full',
                        store.state.aiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    ]"></div>
                    <span :class="[
                        'text-xs font-medium',
                        store.state.aiOnline ? 'text-green-700' : 'text-red-600'
                    ]">
                        {{ getAiStatusText() }}
                    </span>
                </div>
                <button @click="refreshAIStatus" class="text-xs text-gray-500 hover:text-gray-700">
                    <i class="fas fa-refresh"></i>
                </button>
            </div>
            
            <!-- AI Status Details -->
            <div v-if="!store.state.aiOnline" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                AI service is offline. Some features may be limited.
            </div>
        </div>

        <!-- Upgrade Banner (Free Users Only) -->
        <div v-if="store.state.subscriptionTier === 'free'" class="p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <div class="text-center">
                <i class="fas fa-crown text-yellow-300 text-lg mb-2"></i>
                <h4 class="font-bold text-sm mb-1">Upgrade to Pro</h4>
                <p class="text-xs text-white/90 mb-3">1500 questions/month, unlimited topics, 5GB storage</p>
                <button @click="showUpgradeModal" 
                        class="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg text-xs font-medium transition-colors">
                    Learn More
                </button>
            </div>
        </div>
    </aside>
    `,

    setup() {
        const store = window.store;

        // Usage calculations
        const questionsUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.questions;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const storageUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.storage;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const topicsUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.topics;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const storageUsedMB = Vue.computed(() => {
            return Math.round((store.state.usage?.storage?.used || 0) / (1024 * 1024));
        });

        const storageUsageLimitMB = Vue.computed(() => {
            return Math.round((store.state.usage?.storage?.limit || 104857600) / (1024 * 1024));
        });

        // Usage warnings
        const hasUsageWarnings = Vue.computed(() => {
            return questionsUsagePercentage.value > 80 || 
                   storageUsagePercentage.value > 80 || 
                   topicsUsagePercentage.value >= 100;
        });

        // Action availability
        const canUpload = Vue.computed(() => {
            return storageUsagePercentage.value < 100;
        });

        const canPractice = Vue.computed(() => {
            return store.state.statistics?.totalQuestions > 0;
        });

        const canGenerate = Vue.computed(() => {
            return questionsUsagePercentage.value < 100;
        });

        const canCreateTopic = Vue.computed(() => {
            const usage = store.state.usage?.topics;
            if (!usage) return true;
            return usage.used < usage.limit;
        });

        // User info
        const getUserInitials = Vue.computed(() => {
            const user = store.state.user;
            if (!user) return 'U';
            const first = user.firstName?.[0]?.toUpperCase() || '';
            const last = user.lastName?.[0]?.toUpperCase() || '';
            return first + last || 'U';
        });

        // Navigation methods
        const setCurrentView = (view) => {
            store.setCurrentView(view);
        };

        const handleUploadClick = () => {
            if (canUpload.value) {
                store.setCurrentView('upload');
            } else {
                store.showNotification('Storage limit reached! Upgrade to Pro for more storage.', 'warning');
            }
        };

        const handlePracticeClick = () => {
            if (canPractice.value) {
                store.setCurrentView('practice');
            } else {
                store.showNotification('Create topics and generate questions first!', 'info');
            }
        };

        const handleGenerateClick = () => {
            if (canGenerate.value) {
                if (store.state.statistics?.totalNotes > 0) {
                    store.setCurrentView('practice');
                } else {
                    store.showNotification('Upload study materials first to generate questions!', 'info');
                    store.setCurrentView('upload');
                }
            } else {
                store.showNotification('Question limit reached! Upgrade to Pro for more questions.', 'warning');
            }
        };

        const handleAddTopicClick = () => {
            if (canCreateTopic.value) {
                if (store.state.selectedSubject) {
                    store.showCreateTopicModal();
                } else {
                    store.showNotification('Select a subject first to create topics!', 'info');
                    store.setCurrentView('subjects');
                }
            } else {
                store.showNotification('Topic limit reached! Upgrade to Pro for unlimited topics.', 'warning');
            }
        };

        const exportData = async () => {
            try {
                store.setLoading(true);
                const data = await window.api.exportData();
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `studyai-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                store.showNotification('Data exported successfully!', 'success');
            } catch (error) {
                console.error('Export error:', error);
                store.showNotification('Failed to export data', 'error');
            } finally {
                store.setLoading(false);
            }
        };

        const showUpgradeModal = () => {
            store.showNotification('Upgrade to Pro for unlimited usage and premium features! Contact support for Pro access.', 'info');
        };

        const refreshAIStatus = async () => {
            try {
                await store.updateAiServiceStatus();
                store.showNotification('AI status refreshed', 'success');
            } catch (error) {
                store.setAiOnline(false);
                store.showNotification('AI service is offline', 'warning');
            }
        };

        const getAiStatusText = () => {
            if (!store.state.aiOnline) {
                return 'AI Offline';
            }
            
            const service = store.state.aiService;
            if (service === 'ollama') {
                return 'Ollama Ready';
            } else if (service === 'openai') {
                return 'OpenAI Ready';
            } else {
                return 'AI Ready';
            }
        };

        return {
            store,
            questionsUsagePercentage,
            storageUsagePercentage,
            topicsUsagePercentage,
            storageUsedMB,
            storageUsageLimitMB,
            hasUsageWarnings,
            canUpload,
            canPractice,
            canGenerate,
            canCreateTopic,
            getUserInitials,
            setCurrentView,
            handleUploadClick,
            handlePracticeClick,
            handleGenerateClick,
            handleAddTopicClick,
            exportData,
            showUpgradeModal,
            refreshAIStatus,
            getAiStatusText
        };
    }
};