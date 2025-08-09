// components/Dashboard/Dashboard-enhanced.js - Dashboard with Usage Integration
window.EnhancedDashboardComponent = {
    template: `
    <div class="animate-fade-in dashboard-content">
        <!-- Welcome Header with User Info -->
        <div class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl text-white p-8 mb-8">
            <!-- User Greeting -->
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h1 class="text-3xl font-bold mb-2">Welcome back, {{ store.state.user?.firstName || 'Student' }}! 👋</h1>
                    <p class="text-white/90">Ready to continue your learning journey?</p>
                </div>
                <div class="text-right space-y-2">
                    <!-- Sync Status Indicator -->
                    <div v-if="syncStatus" class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-2">
                        <div :class="[
                            'w-2 h-2 rounded-full',
                            syncStatus.needsSync ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                        ]"></div>
                        <span class="text-xs text-white/80">
                            {{ syncStatus.needsSync ? 'Sync needed' : 'In sync' }}
                        </span>
                        <button v-if="syncStatus.needsSync" 
                                @click="performSync" 
                                class="text-xs text-white/90 hover:text-white underline ml-1">
                            Sync
                        </button>
                    </div>
                    
                    <!-- Plan Badge -->
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p class="text-sm text-white/80">Current Plan</p>
                        <p class="font-bold text-lg">{{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}</p>
                    </div>
                </div>
            </div>
            
            <!-- Usage Summary Bar -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-white/80">Questions Generated</span>
                        <i class="fas fa-question-circle text-white/60"></i>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex-1 bg-white/20 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full transition-all duration-500" 
                                 :style="{ width: questionsUsagePercentage + '%' }"></div>
                        </div>
                        <span class="text-sm font-medium text-white">{{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}</span>
                    </div>
                </div>
                
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-white/80">Storage Used</span>
                        <i class="fas fa-hdd text-white/60"></i>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex-1 bg-white/20 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full transition-all duration-500" 
                                 :style="{ width: storageUsagePercentage + '%' }"></div>
                        </div>
                        <span class="text-sm font-medium text-white">{{ storageUsedMB }}MB/{{ storageUsageLimitMB }}MB</span>
                    </div>
                </div>
                
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-white/80">Topics Created</span>
                        <i class="fas fa-folder text-white/60"></i>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex-1 bg-white/20 rounded-full h-2">
                            <div class="bg-white h-2 rounded-full transition-all duration-500" 
                                 :style="{ width: topicsUsagePercentage + '%' }"></div>
                        </div>
                        <span class="text-sm font-medium text-white">{{ store.state.usage?.topics?.used || 0 }}/{{ store.state.usage?.topics?.limit || 3 }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Usage Alert (if near limits) -->
        <div v-if="showUsageAlert" class="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-orange-400"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-orange-700">
                        <strong>Usage Alert:</strong> {{ usageAlertMessage }}
                        <button v-if="store.state.subscriptionTier === 'free'" 
                                @click="showUpgradeModal" 
                                class="ml-2 text-orange-800 underline hover:text-orange-900">
                            Upgrade to Pro
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Enhanced Statistics Cards with Usage Context -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                    <!-- Subscription Badge -->
                    <div class="absolute top-4 right-4">
                        <span :class="[
                            'px-2 py-1 rounded-full text-xs font-medium',
                            store.state.subscriptionTier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        ]">
                            {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}
                        </span>
                    </div>
                    
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">📊 Your Progress & Usage</h3>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="text-center p-4 bg-primary-50 rounded-lg relative">
                            <div class="text-2xl font-bold text-primary-600">{{ store.state.statistics.totalTopics }}</div>
                            <div class="text-sm text-gray-600">Topics</div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ store.state.usage?.topics?.used || 0 }}/{{ store.state.usage?.topics?.limit || 3 }} used
                            </div>
                        </div>
                        
                        <div class="text-center p-4 bg-secondary-50 rounded-lg relative">
                            <div class="text-2xl font-bold text-secondary-600">{{ store.state.statistics.totalQuestions }}</div>
                            <div class="text-sm text-gray-600">Questions</div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }} used
                            </div>
                        </div>
                        
                        <div class="text-center p-4 bg-green-50 rounded-lg relative">
                            <div class="text-2xl font-bold text-green-600">{{ store.state.statistics.totalPracticeSessions }}</div>
                            <div class="text-sm text-gray-600">Sessions</div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ (store.state.statistics.averageScore || 0).toFixed(1) }}% avg score
                            </div>
                        </div>
                        
                        <div class="text-center p-4 bg-orange-50 rounded-lg relative">
                            <div class="text-2xl font-bold text-orange-600">{{ storageUsedMB }}MB</div>
                            <div class="text-sm text-gray-600">Storage</div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ storageUsagePercentage.toFixed(1) }}% of {{ storageUsageLimitMB }}MB
                            </div>
                        </div>
                    </div>
                    
                    <!-- Usage Warnings -->
                    <div v-if="hasUsageWarnings" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 class="text-sm font-medium text-yellow-800 mb-2">Usage Warnings:</h4>
                        <ul class="text-xs text-yellow-700 space-y-1">
                            <li v-if="questionsUsagePercentage > 80">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                You've used {{ questionsUsagePercentage.toFixed(0) }}% of your question limit
                            </li>
                            <li v-if="storageUsagePercentage > 80">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                You've used {{ storageUsagePercentage.toFixed(0) }}% of your storage limit
                            </li>
                            <li v-if="topicsUsagePercentage > 80">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                You've used {{ topicsUsagePercentage.toFixed(0) }}% of your topic limit
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Fixed Subjects Grid -->
                <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">📚 Choose Your Subject</h3>
                        <span class="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {{ store.state.subjects.length }} Available
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="subject in store.state.subjects"
                            :key="subject.id"
                            @click="selectSubject(subject)"
                            class="group p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-50 to-white"
                        >
                            <div class="text-center">
                                <div :class="['w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 text-white group-hover:scale-110 transition-transform', subject.color]">
                                    <i :class="subject.icon" class="text-lg"></i>
                                </div>
                                <h4 class="font-medium text-gray-900 mb-1 group-hover:text-primary-600 transition-colors text-sm">
                                    {{ subject.name }}
                                </h4>
                                <p class="text-xs text-gray-500 leading-tight">
                                    {{ subject.description }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Quick Actions -->
                <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
                    <div class="space-y-3">
                        <!-- Upload Materials -->
                        <button
                            @click="goToUpload"
                            :disabled="!canUpload"
                            :class="[
                                'w-full flex items-center p-3 rounded-lg transition-all duration-300 text-left',
                                canUpload 
                                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300' 
                                    : 'bg-gray-50 border border-gray-200 cursor-not-allowed opacity-75'
                            ]"
                        >
                            <div :class="[
                                'w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3',
                                canUpload ? 'bg-blue-500' : 'bg-gray-400'
                            ]">
                                <i class="fas fa-upload"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">Upload Materials</h4>
                                <p class="text-xs text-gray-600">
                                    {{ canUpload ? 'Add study materials' : 'Storage limit reached' }}
                                </p>
                            </div>
                        </button>
                        
                        <!-- Practice Questions -->
                        <button
                            @click="goToPractice"
                            :disabled="!canPractice"
                            :class="[
                                'w-full flex items-center p-3 rounded-lg transition-all duration-300 text-left',
                                canPractice 
                                    ? 'bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300' 
                                    : 'bg-gray-50 border border-gray-200 cursor-not-allowed opacity-75'
                            ]"
                        >
                            <div :class="[
                                'w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3',
                                canPractice ? 'bg-green-500' : 'bg-gray-400'
                            ]">
                                <i class="fas fa-brain"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">Practice Questions</h4>
                                <p class="text-xs text-gray-600">
                                    {{ canPractice ? 'Start practicing' : 'No questions available' }}
                                </p>
                            </div>
                        </button>
                        
                        <!-- Generate Questions -->
                        <button
                            @click="goToGenerate"
                            :disabled="!canGenerate"
                            :class="[
                                'w-full flex items-center p-3 rounded-lg transition-all duration-300 text-left',
                                canGenerate 
                                    ? 'bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300' 
                                    : 'bg-gray-50 border border-gray-200 cursor-not-allowed opacity-75'
                            ]"
                        >
                            <div :class="[
                                'w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3',
                                canGenerate ? 'bg-purple-500' : 'bg-gray-400'
                            ]">
                                <i class="fas fa-magic"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">Generate Questions</h4>
                                <p class="text-xs text-gray-600">
                                    {{ canGenerate ? 'Create AI questions' : 'Question limit reached' }}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- AI Status -->
                <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">🤖 AI Status</h3>
                    
                    <!-- OpenAI Status -->
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                        <div class="flex items-center">
                            <div :class="[
                                'w-3 h-3 rounded-full mr-3',
                                store.state.aiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            ]"></div>
                            <span class="text-sm font-medium text-gray-900">OpenAI Service</span>
                        </div>
                        <span :class="[
                            'text-xs font-medium px-2 py-1 rounded-full',
                            store.state.aiOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        ]">
                            {{ store.state.aiOnline ? 'Online' : 'Offline' }}
                        </span>
                    </div>

                    <!-- Offline Mode Status -->
                    <div v-if="shouldShowOfflineOption" class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center">
                                <div :class="[
                                    'w-3 h-3 rounded-full mr-3',
                                    offlineStatus === 'ready' ? 'bg-green-500' : 
                                    offlineStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
                                ]"></div>
                                <span class="text-sm font-medium text-gray-900">Offline Mode</span>
                            </div>
                            <span :class="[
                                'text-xs font-medium px-2 py-1 rounded-full',
                                offlineStatus === 'ready' ? 'bg-green-100 text-green-700' : 
                                offlineStatus === 'checking' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                            ]">
                                {{ getOfflineStatusText() }}
                            </span>
                        </div>

                        <!-- Enable Offline Mode Button (Alpha) -->
                        <button 
                            v-if="offlineStatus === 'not_available'"
                            @click="showOfflineSetup = true"
                            class="w-full flex items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-lg transition-all duration-300 relative"
                        >
                            <i class="fas fa-download text-purple-600 mr-2"></i>
                            <span class="text-sm font-medium text-purple-700">Enable Offline Mode</span>
                            <span class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                ALPHA
                            </span>
                        </button>

                        <!-- Offline Mode Already Ready -->
                        <div v-if="offlineStatus === 'ready'" class="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                    <span class="text-sm font-medium text-green-900">Offline Mode Ready</span>
                                </div>
                                <span class="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    ALPHA
                                </span>
                            </div>
                            <p class="text-xs text-green-700 mb-2">You can generate questions without internet connection.</p>
                            <button @click="testOfflineFeatures" class="text-xs text-green-600 hover:text-green-700 font-medium">
                                <i class="fas fa-play mr-1"></i>
                                Test Offline Features
                            </button>
                        </div>
                    </div>

                    <!-- Platform Not Supported Message -->
                    <div v-else-if="window.configManager?.isFeatureEnabled('offlineMode')" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-yellow-600 mr-2 mt-0.5"></i>
                            <div class="text-sm text-yellow-700">
                                <div class="font-medium mb-1">Offline Mode (Alpha)</div>
                                <p class="text-xs">Available only on desktop computers (Windows, Mac, Linux). Not supported on mobile devices.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Offline Setup Component -->
                    <OfflineSetupComponent 
                        v-if="showOfflineSetup"
                        :show="showOfflineSetup"
                        @close="showOfflineSetup = false"
                        @offline-ready="handleOfflineReady"
                    />
                </div>

                <!-- Advertisement Placement -->
                <AdComponent 
                    placement="dashboard_sidebar"
                    size="medium"
                />

                <!-- Recent Activity -->
                <div v-if="recentActivity.length > 0" class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">⏰ Recent Activity</h3>
                    <div class="space-y-3">
                        <div
                            v-for="activity in recentActivity.slice(0, 3)"
                            :key="activity.id"
                            class="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                        >
                            <div :class="[
                                'w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs',
                                getActivityIconClass(activity.type)
                            ]">
                                <i :class="getActivityIcon(activity.type)"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-xs font-medium text-gray-900 truncate">{{ activity.title }}</p>
                                <p class="text-xs text-gray-500">{{ formatTimeAgo(activity.created_at) }}</p>
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
        
        // Sync status
        const syncStatus = Vue.ref(null);
        const isSyncing = Vue.ref(false);
        
        // Check sync status on load
        const checkSyncStatus = async () => {
            try {
                const status = await window.syncClient.getSyncStatus();
                if (status.success) {
                    syncStatus.value = status.status;
                }
            } catch (error) {
                console.warn('Failed to check sync status:', error);
            }
        };
        
        // Perform manual sync
        const performSync = async () => {
            if (isSyncing.value) return;
            
            isSyncing.value = true;
            try {
                const result = await window.syncClient.performSync();
                if (result.success) {
                    // Refresh sync status after successful sync
                    setTimeout(checkSyncStatus, 1000);
                    
                    // Refresh dashboard data
                    if (store.loadDashboardData) {
                        store.loadDashboardData();
                    }
                }
            } catch (error) {
                console.error('Sync failed:', error);
            } finally {
                isSyncing.value = false;
            }
        };
        
        // Check sync status on component mount
        Vue.onMounted(() => {
            setTimeout(checkSyncStatus, 2000); // Delay to let auth complete
        });
        
        // Usage calculations with dynamic limits
        const effectiveLimits = Vue.computed(() => {
            const userTier = store.state.subscriptionTier || 'free';
            return window.configManager?.getTierLimits(userTier) || {
                questionsPerMonth: 100,
                topicsPerAccount: 3,
                storagePerAccount: '50MB'
            };
        });

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

        // Usage alerts
        const showUsageAlert = Vue.computed(() => {
            return questionsUsagePercentage.value > 80 || 
                   storageUsagePercentage.value > 80 || 
                   topicsUsagePercentage.value > 80;
        });

        const usageAlertMessage = Vue.computed(() => {
            const alerts = [];
            if (questionsUsagePercentage.value > 80) alerts.push(`Questions: ${questionsUsagePercentage.value.toFixed(0)}% used`);
            if (storageUsagePercentage.value > 80) alerts.push(`Storage: ${storageUsagePercentage.value.toFixed(0)}% used`);
            if (topicsUsagePercentage.value > 80) alerts.push(`Topics: ${topicsUsagePercentage.value.toFixed(0)}% used`);
            return alerts.join(', ');
        });

        const hasUsageWarnings = Vue.computed(() => {
            return questionsUsagePercentage.value > 80 || 
                   storageUsagePercentage.value > 80 || 
                   topicsUsagePercentage.value > 80;
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

        // Recent activity
        const recentActivity = Vue.ref([]);

        // Offline setup state
        const showOfflineSetup = Vue.ref(false);
        const offlineStatus = Vue.ref('checking'); // 'checking', 'not_available', 'ready', 'installing'

        // Navigation functions
        const selectSubject = (subject) => {
            store.selectSubject(subject);
            store.setCurrentView('subjects');
        };

        const goToUpload = () => {
            if (canUpload.value) {
                store.setCurrentView('upload');
            } else {
                store.showNotification('Storage limit reached. Upgrade to Pro for more storage!', 'warning');
            }
        };

        const goToPractice = () => {
            if (canPractice.value) {
                store.setCurrentView('practice');
            } else {
                store.showNotification('Create topics and generate questions first!', 'info');
            }
        };

        const goToGenerate = () => {
            if (canGenerate.value) {
                store.setCurrentView('practice');
            } else {
                store.showNotification('Question limit reached. Upgrade to Pro for more questions!', 'warning');
            }
        };

        const showUpgradeModal = () => {
            store.showNotification('Upgrade to Pro for unlimited usage! Contact support for details.', 'info');
        };

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

        // Offline setup functions
        const getOfflineStatusText = () => {
            switch (offlineStatus.value) {
                case 'checking': return 'Checking...';
                case 'not_available': return 'Not Setup';
                case 'ready': return 'Ready';
                case 'installing': return 'Installing...';
                default: return 'Unknown';
            }
        };

        const checkOfflineStatus = async () => {
            try {
                const response = await fetch('/api/setup/offline/status');
                const result = await response.json();
                
                if (result.status === 'ready') {
                    offlineStatus.value = 'ready';
                } else if (result.status === 'not_installed' || result.status === 'installed_but_not_working') {
                    offlineStatus.value = 'not_available';
                } else {
                    offlineStatus.value = 'not_available';
                }
            } catch (error) {
                console.warn('Could not check offline status:', error);
                offlineStatus.value = 'not_available';
            }
        };

        // Platform detection
        const isDesktopPlatform = Vue.computed(() => {
            const userAgent = navigator.userAgent.toLowerCase();
            const platform = navigator.platform.toLowerCase();
            
            // Check if it's desktop (Windows, Mac, Linux)
            const isWindows = platform.includes('win') || userAgent.includes('windows');
            const isMac = platform.includes('mac') || userAgent.includes('macintosh');
            const isLinux = platform.includes('linux') && !userAgent.includes('android');
            
            // Not mobile/tablet
            const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            
            return (isWindows || isMac || isLinux) && !isMobile;
        });

        const shouldShowOfflineOption = Vue.computed(() => {
            return isDesktopPlatform.value && window.configManager?.isFeatureEnabled('offlineMode');
        });

        const handleOfflineReady = () => {
            offlineStatus.value = 'ready';
            store.showNotification('Offline mode is now ready! You can generate questions without internet.', 'success');
        };

        const testOfflineFeatures = async () => {
            try {
                const response = await fetch('/api/setup/offline/test');
                const result = await response.json();
                
                if (result.success) {
                    store.showNotification('Offline features are working correctly!', 'success');
                } else {
                    store.showNotification('Offline test failed: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Offline test failed:', error);
                store.showNotification('Could not test offline features. Check console for details.', 'error');
            }
        };

        // Load recent activity
        const loadRecentActivity = async () => {
            try {
                const activity = await window.api.getRecentActivity(5);
                recentActivity.value = activity;
            } catch (error) {
                console.error('Failed to load recent activity:', error);
                recentActivity.value = [];
            }
        };

        // Load data on mount
        Vue.onMounted(async () => {
            await loadRecentActivity();
            await checkOfflineStatus();
        });

        return {
            store,
            questionsUsagePercentage,
            storageUsagePercentage,
            topicsUsagePercentage,
            storageUsedMB,
            storageUsageLimitMB,
            showUsageAlert,
            usageAlertMessage,
            hasUsageWarnings,
            canUpload,
            canPractice,
            canGenerate,
            recentActivity,
            selectSubject,
            goToUpload,
            goToPractice,
            goToGenerate,
            showUpgradeModal,
            getActivityIcon,
            getActivityIconClass,
            formatTimeAgo,
            // Sync functionality
            syncStatus,
            isSyncing,
            performSync,
            checkSyncStatus,
            // Offline setup
            showOfflineSetup,
            offlineStatus,
            getOfflineStatusText,
            handleOfflineReady,
            testOfflineFeatures,
            // Platform detection
            isDesktopPlatform,
            shouldShowOfflineOption
        };
    }
};