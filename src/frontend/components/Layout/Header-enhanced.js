// components/Layout/Header-enhanced.js - Header with User Stats Integration
window.EnhancedHeaderComponent = {
    template: `
    <header class="md-header px-3 sm:px-4 md:px-6 py-3 md:py-4" @click="closeUserMenu">
        <div class="flex items-center justify-between">
            <!-- Mobile Menu Button -->
            <button 
                @click.stop="toggleMobileSidebar"
                class="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors mr-3"
                title="Open menu"
            >
                <i class="fas fa-bars text-white text-lg"></i>
            </button>
            
            <!-- Left Section -->
            <div class="flex-1 min-w-0">
                <h2 class="text-lg sm:text-xl md:text-2xl font-semibold truncate" style="color: var(--md-sys-color-on-primary);">
                    {{ pageTitle }}
                </h2>
                <p class="text-xs sm:text-sm mt-1 opacity-80 truncate" style="color: var(--md-sys-color-on-primary);">
                    {{ pageDescription }}
                </p>
            </div>
            
            <!-- Right Section with User Info -->
            <div class="flex items-center space-x-2 sm:space-x-4">
                <!-- Usage Indicators (Desktop Only) -->
                <div class="hidden xl:flex items-center space-x-3 text-sm">
                    <!-- Questions Usage -->
                    <div class="flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg" 
                         :title="'Questions used this month: ' + (store.state.usage?.questions?.used || 0) + '/' + (store.state.usage?.questions?.limit || 50)">
                        <i class="fas fa-question-circle text-white/80"></i>
                        <span class="text-white/90 font-medium">{{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}</span>
                        <div v-if="questionsUsagePercentage > 80" class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    <!-- Storage Usage -->
                    <div class="flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg"
                         :title="'Storage used: ' + storageUsedMB + 'MB / ' + storageUsageLimitMB + 'MB'">
                        <i class="fas fa-hdd text-white/80"></i>
                        <span class="text-white/90 font-medium">{{ storageUsedMB }}MB</span>
                        <div v-if="storageUsagePercentage > 80" class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    <!-- Subscription Tier -->
                    <div class="px-3 py-1 rounded-lg" :class="store.state.subscriptionTier === 'pro' ? 'bg-purple-500/80 text-white' : 'bg-white/20 text-white/90'">
                        <span class="text-xs font-bold">{{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}</span>
                    </div>
                </div>
                
                <!-- User Profile Dropdown -->
                <div class="relative" v-if="store.state.isAuthenticated">
                    <button 
                        @click.stop="showUserMenu = !showUserMenu"
                        class="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <div class="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-user text-white text-xs sm:text-sm"></i>
                        </div>
                        <div class="hidden lg:block text-left min-w-0">
                            <p class="text-white text-sm font-medium truncate">{{ store.state.user?.firstName || 'User' }}</p>
                            <p class="text-white/70 text-xs truncate">{{ store.state.user?.email || '' }}</p>
                        </div>
                        <i class="fas fa-chevron-down text-white/70 text-xs transition-transform duration-200" 
                           :class="{ 'rotate-180': showUserMenu }"></i>
                    </button>
                    
                    <!-- User Dropdown Menu -->
                    <div v-if="showUserMenu" 
                         class="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                         @click.stop>
                        <!-- User Info -->
                        <div class="px-4 py-3 border-b border-gray-200">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                    <span class="text-white font-bold text-lg">{{ getUserInitials }}</span>
                                </div>
                                <div class="flex-1">
                                    <p class="font-medium text-gray-900">{{ store.state.user?.firstName }} {{ store.state.user?.lastName }}</p>
                                    <p class="text-sm text-gray-600">{{ store.state.user?.email }}</p>
                                    <div class="mt-1 flex items-center space-x-2">
                                        <span :class="[
                                            'px-2 py-1 text-xs font-medium rounded-full',
                                            store.state.subscriptionTier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                        ]">
                                            {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}
                                        </span>
                                        <span class="text-xs text-gray-500">since {{ formatJoinDate }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Usage Stats -->
                        <div class="px-4 py-3 border-b border-gray-200">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-xs font-semibold text-gray-700">MONTHLY USAGE</h4>
                                <button @click="refreshUsageStats" class="text-xs text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-refresh"></i>
                                </button>
                            </div>
                            <div class="space-y-3">
                                <!-- Questions Usage -->
                                <div>
                                    <div class="flex items-center justify-between text-sm mb-1">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-question-circle mr-1 text-blue-500"></i>
                                            Questions
                                        </span>
                                        <span class="font-medium" :class="questionsUsagePercentage > 90 ? 'text-red-600' : 'text-gray-900'">
                                            {{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}
                                        </span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="h-2 rounded-full transition-all duration-300" 
                                             :class="questionsUsagePercentage > 90 ? 'bg-red-500' : questionsUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'"
                                             :style="{ width: questionsUsagePercentage + '%' }"></div>
                                    </div>
                                    <p v-if="questionsUsagePercentage > 80" class="text-xs mt-1" 
                                       :class="questionsUsagePercentage > 90 ? 'text-red-600' : 'text-yellow-600'">
                                        {{ questionsUsagePercentage > 90 ? 'Limit almost reached!' : 'Running low' }}
                                    </p>
                                </div>
                                
                                <!-- Storage Usage -->
                                <div>
                                    <div class="flex items-center justify-between text-sm mb-1">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-hdd mr-1 text-green-500"></i>
                                            Storage
                                        </span>
                                        <span class="font-medium" :class="storageUsagePercentage > 90 ? 'text-red-600' : 'text-gray-900'">
                                            {{ storageUsedMB }}MB/{{ storageUsageLimitMB }}MB
                                        </span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="h-2 rounded-full transition-all duration-300" 
                                             :class="storageUsagePercentage > 90 ? 'bg-red-500' : storageUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'"
                                             :style="{ width: storageUsagePercentage + '%' }"></div>
                                    </div>
                                    <p v-if="storageUsagePercentage > 80" class="text-xs mt-1" 
                                       :class="storageUsagePercentage > 90 ? 'text-red-600' : 'text-yellow-600'">
                                        {{ Math.max(0, storageUsageLimitMB - storageUsedMB) }}MB remaining
                                    </p>
                                </div>
                                
                                <!-- Topics Usage -->
                                <div>
                                    <div class="flex items-center justify-between text-sm mb-1">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-folder mr-1 text-purple-500"></i>
                                            Topics
                                        </span>
                                        <span class="font-medium" :class="topicsUsagePercentage > 90 ? 'text-red-600' : 'text-gray-900'">
                                            {{ store.state.usage?.topics?.used || 0 }}/{{ store.state.usage?.topics?.limit || 3 }}
                                        </span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="h-2 rounded-full transition-all duration-300" 
                                             :class="topicsUsagePercentage > 90 ? 'bg-red-500' : topicsUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-purple-500'"
                                             :style="{ width: topicsUsagePercentage + '%' }"></div>
                                    </div>
                                    <p v-if="topicsUsagePercentage >= 100" class="text-xs mt-1 text-red-600">
                                        Topic limit reached
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Menu Items -->
                        <div class="py-2">
                            <!-- Upgrade CTA for Free Users -->
                            <button v-if="store.state.subscriptionTier === 'free'" 
                                    @click="showUpgradeModal" 
                                    class="w-full px-4 py-3 text-left text-sm bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 hover:from-purple-100 hover:to-blue-100 flex items-center border-b border-gray-100">
                                <i class="fas fa-crown mr-3 text-purple-500"></i>
                                <div>
                                    <div class="font-medium">Upgrade to Pro</div>
                                    <div class="text-xs text-purple-600">1500 questions, unlimited topics, 5GB storage</div>
                                </div>
                            </button>
                            
                            <!-- Account Settings -->
                            <button @click="showAccountSettings" 
                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                <i class="fas fa-user-cog mr-3 text-gray-500"></i>Account Settings
                            </button>
                            
                            <!-- Export Data -->
                            <button @click="exportData" 
                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                <i class="fas fa-download mr-3 text-gray-500"></i>Export Data
                            </button>
                            
                            <!-- Usage History -->
                            <button @click="showUsageHistory" 
                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                <i class="fas fa-chart-line mr-3 text-gray-500"></i>Usage History
                            </button>
                            
                            <hr class="my-2 border-gray-200">
                            
                            <!-- Sign Out -->
                            <button @click="logout" 
                                    class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center">
                                <i class="fas fa-sign-out-alt mr-3 text-red-500"></i>Sign Out
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- AI Status -->
                <div class="flex items-center space-x-2 text-sm">
                    <div :class="[
                        'w-2 h-2 rounded-full',
                        store.state.aiOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    ]"></div>
                    <span class="text-white/90 font-medium">
                        {{ getAiStatusText() }}
                    </span>
                </div>
                
                <!-- Loading Indicator -->
                <div v-if="store.state.loading || store.state.generating" class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span class="text-white/90 text-sm font-medium">
                        {{ store.state.generating ? 'Generating...' : 'Loading...' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Breadcrumb Navigation -->
        <div v-if="breadcrumbs.length > 0" class="flex items-center space-x-2 mt-4 text-sm">
            <i class="fas fa-home text-white/60 text-xs"></i>
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
                <button
                    @click="navigateTo(crumb)"
                    :class="[
                        'flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/10 transition-colors',
                        index === breadcrumbs.length - 1 ? 'text-white font-medium bg-white/10' : 'text-white/80 hover:text-white'
                    ]"
                >
                    <i v-if="crumb.icon" :class="crumb.icon" class="text-xs"></i>
                    <span>{{ crumb.label }}</span>
                </button>
                <i v-if="index < breadcrumbs.length - 1" class="fas fa-chevron-right text-white/60 text-xs"></i>
            </template>
        </div>

        <!-- Usage Alert Banner -->
        <div v-if="showUsageAlert" class="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle text-yellow-300 mr-2"></i>
                <p class="text-white text-sm">
                    <strong>Usage Alert:</strong> {{ usageAlertMessage }}
                    <button v-if="store.state.subscriptionTier === 'free'" 
                            @click="showUpgradeModal" 
                            class="ml-2 text-yellow-100 underline hover:text-white">
                        Upgrade Now
                    </button>
                </p>
            </div>
        </div>
    </header>
    `,
    
    setup() {
        const store = window.store;
        const showUserMenu = Vue.ref(false);

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

        // Usage alerts
        const showUsageAlert = Vue.computed(() => {
            return questionsUsagePercentage.value > 85 || 
                   storageUsagePercentage.value > 85 || 
                   topicsUsagePercentage.value >= 100;
        });

        const usageAlertMessage = Vue.computed(() => {
            const alerts = [];
            if (questionsUsagePercentage.value > 85) alerts.push(`Questions: ${questionsUsagePercentage.value.toFixed(0)}% used`);
            if (storageUsagePercentage.value > 85) alerts.push(`Storage: ${storageUsagePercentage.value.toFixed(0)}% used`);
            if (topicsUsagePercentage.value >= 100) alerts.push('Topics: Limit reached');
            return alerts.join(', ');
        });

        // User info
        const getUserInitials = Vue.computed(() => {
            const user = store.state.user;
            if (!user) return 'U';
            const first = user.firstName?.[0]?.toUpperCase() || '';
            const last = user.lastName?.[0]?.toUpperCase() || '';
            return first + last || 'U';
        });

        const formatJoinDate = Vue.computed(() => {
            const user = store.state.user;
            if (!user?.createdAt) return 'recently';
            const date = new Date(user.createdAt);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        // Page info
        const pageInfo = Vue.computed(() => {
            switch (store.state.currentView) {
                case 'dashboard':
                    return {
                        title: 'Dashboard',
                        description: 'Overview of your learning progress and quick actions'
                    };
                case 'subjects':
                    if (store.state.selectedSubject) {
                        return {
                            title: `${store.state.selectedSubject.name} Topics`,
                            description: 'Manage your learning topics and study materials'
                        };
                    }
                    return {
                        title: 'Study Subjects',
                        description: 'Choose from study areas to organize your learning'
                    };
                case 'upload':
                    return {
                        title: 'Upload Study Materials',
                        description: 'Add notes, PDFs, and documents for AI analysis'
                    };
                case 'practice':
                    if (store.state.selectedTopic) {
                        return {
                            title: `Practice: ${store.state.selectedTopic.name}`,
                            description: 'Test your knowledge with AI-generated questions'
                        };
                    }
                    return {
                        title: 'Practice Session',
                        description: 'Test your knowledge with AI-generated questions'
                    };
                default:
                    return {
                        title: 'Jaquizy',
                        description: 'Intelligent Learning Platform'
                    };
            }
        });

        // Breadcrumbs
        const breadcrumbs = Vue.computed(() => {
            const crumbs = [];
            
            if (store.state.currentView !== 'dashboard') {
                crumbs.push({
                    label: 'Dashboard',
                    icon: 'fas fa-home',
                    action: () => store.setCurrentView('dashboard')
                });
            }
            
            if (store.state.selectedSubject && ['topics', 'subjects'].includes(store.state.currentView)) {
                crumbs.push({
                    label: 'Subjects',
                    icon: 'fas fa-book',
                    action: () => {
                        store.clearSelection();
                        store.setCurrentView('subjects');
                    }
                });
                crumbs.push({
                    label: store.state.selectedSubject.name,
                    action: null
                });
            }
            
            return crumbs;
        });

        // Methods
        const navigateTo = (crumb) => {
            if (crumb.action) {
                crumb.action();
            }
        };

        const closeUserMenu = () => {
            showUserMenu.value = false;
        };

        const refreshUsageStats = async () => {
            try {
                await store.loadUsageStats();
                store.showNotification('Usage stats refreshed', 'success');
            } catch (error) {
                store.showNotification('Failed to refresh usage stats', 'error');
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

        const showUpgradeModal = () => {
            closeUserMenu();
            store.showNotification('Upgrade to Pro for unlimited usage! Contact support for Pro access.', 'info');
        };

        const showAccountSettings = () => {
            closeUserMenu();
            store.showNotification('Account settings coming soon!', 'info');
        };

        const showUsageHistory = () => {
            closeUserMenu();
            store.showNotification('Usage history coming soon!', 'info');
        };

        const exportData = async () => {
            closeUserMenu();
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

        const logout = () => {
            closeUserMenu();
            if (confirm('Are you sure you want to sign out?')) {
                store.logout();
            }
        };

        // Mobile sidebar toggle
        const toggleMobileSidebar = () => {
            console.log('Header: Toggling mobile sidebar');
            // Emit the toggle event to parent component
            const event = new CustomEvent('toggle-sidebar');
            document.dispatchEvent(event);
        };

        // Close menu when clicking outside
        Vue.onMounted(() => {
            document.addEventListener('click', closeUserMenu);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('click', closeUserMenu);
        });

        return {
            store,
            showUserMenu,
            questionsUsagePercentage,
            storageUsagePercentage,
            topicsUsagePercentage,
            storageUsedMB,
            storageUsageLimitMB,
            showUsageAlert,
            usageAlertMessage,
            getUserInitials,
            formatJoinDate,
            pageTitle: Vue.computed(() => pageInfo.value.title),
            pageDescription: Vue.computed(() => pageInfo.value.description),
            breadcrumbs,
            navigateTo,
            closeUserMenu,
            refreshUsageStats,
            showUpgradeModal,
            showAccountSettings,
            showUsageHistory,
            exportData,
            logout,
            getAiStatusText,
            toggleMobileSidebar
        };
    }
};