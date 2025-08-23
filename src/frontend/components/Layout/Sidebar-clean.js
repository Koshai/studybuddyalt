// components/Layout/Sidebar-clean.js - Clean, Simple Responsive Sidebar
window.CleanSidebarComponent = {
    template: `
    <!-- Mobile Overlay -->
    <div v-if="isOpen && isMobile" 
         @click="closeSidebar"
         class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
    </div>
    
    <!-- Sidebar Container -->
    <div :class="sidebarClasses">
        <!-- Logo/Brand -->
        <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-brain text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">Jaquizy</h1>
                        <p class="text-xs text-gray-600">AI-Powered Learning</p>
                    </div>
                </div>
                <!-- Mobile Close Button -->
                <button @click="closeSidebar" 
                        class="lg:hidden p-1 rounded-lg hover:bg-gray-100">
                    <i class="fas fa-times text-gray-600"></i>
                </button>
            </div>
        </div>

        <!-- User Info -->
        <div v-if="store.state.isAuthenticated" class="p-4 bg-gray-50 border-b border-gray-200">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="font-bold text-sm text-white">{{ getUserInitials() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ store.state.user?.firstName }} {{ store.state.user?.lastName }}</p>
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                        {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 p-4 overflow-y-auto">
            <div class="space-y-2">
                <!-- Dashboard -->
                <button @click="navigateTo('dashboard')" 
                        :class="getNavItemClass('dashboard')">
                    <i class="fas fa-home w-5"></i>
                    <span>Dashboard</span>
                </button>

                <!-- Subjects -->
                <button @click="navigateTo('subjects')" 
                        :class="getNavItemClass('subjects')">
                    <i class="fas fa-book w-5"></i>
                    <span>Subjects</span>
                    <span v-if="store.state.statistics?.totalTopics > 0" 
                          class="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {{ store.state.statistics.totalTopics }}
                    </span>
                </button>

                <!-- Upload -->
                <button @click="navigateTo('upload')" 
                        :class="getNavItemClass('upload')"
                        :disabled="!canUpload">
                    <i class="fas fa-upload w-5"></i>
                    <span>Upload Materials</span>
                    <i v-if="!canUpload" class="fas fa-exclamation-triangle text-red-500 text-xs ml-auto"></i>
                </button>

                <!-- Practice -->
                <button @click="navigateTo('practice')" 
                        :class="getNavItemClass('practice')"
                        :disabled="!canPractice">
                    <i class="fas fa-brain w-5"></i>
                    <span>Practice</span>
                    <span v-if="store.state.statistics?.totalQuestions > 0" 
                          class="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {{ store.state.statistics.totalQuestions }}
                    </span>
                </button>

                <!-- Flashcards -->
                <button @click="navigateTo('flashcards')" 
                        :class="getNavItemClass('flashcards')">
                    <i class="fas fa-cards-blank w-5"></i>
                    <span>Flashcards</span>
                    <span class="ml-auto bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        NEW
                    </span>
                </button>

                <!-- Settings -->
                <button @click="navigateTo('settings')" 
                        :class="getNavItemClass('settings')">
                    <i class="fas fa-cog w-5"></i>
                    <span>Settings</span>
                </button>
            </div>
        </nav>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-200 bg-gray-50">
            <!-- AI Status -->
            <div class="flex items-center justify-between text-sm mb-3">
                <div class="flex items-center space-x-2">
                    <div :class="[
                        'w-2 h-2 rounded-full',
                        store.state.aiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    ]"></div>
                    <span :class="store.state.aiOnline ? 'text-green-700' : 'text-red-600'">
                        {{ store.state.aiOnline ? 'AI Online' : 'AI Offline' }}
                    </span>
                </div>
                <button @click="refreshAI" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-refresh text-xs"></i>
                </button>
            </div>

            <!-- Usage Stats -->
            <div class="space-y-2 mb-3">
                <div>
                    <div class="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Questions</span>
                        <span>{{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1">
                        <div class="bg-blue-500 h-1 rounded-full" 
                             :style="{ width: Math.min((store.state.usage?.questions?.used || 0) / (store.state.usage?.questions?.limit || 50) * 100, 100) + '%' }"></div>
                    </div>
                </div>
            </div>

            <!-- Upgrade Banner -->
            <div v-if="store.state.subscriptionTier === 'free'" 
                 class="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-center">
                <i class="fas fa-crown text-yellow-300 text-sm mb-1 block"></i>
                <h4 class="font-bold text-xs mb-1">Upgrade to Pro</h4>
                <button @click="showUpgrade" 
                        class="w-full bg-white/20 hover:bg-white/30 text-white py-1 px-2 rounded text-xs font-medium">
                    Learn More
                </button>
            </div>
        </div>
    </div>
    `,

    props: {
        isOpen: {
            type: Boolean,
            default: false
        }
    },

    emits: ['close'],

    setup(props, { emit }) {
        const store = window.store;

        // Reactive computed properties
        const isMobile = Vue.ref(window.innerWidth < 1024);
        
        // Update on resize
        Vue.onMounted(() => {
            const handleResize = () => {
                isMobile.value = window.innerWidth < 1024;
            };
            window.addEventListener('resize', handleResize);
            Vue.onUnmounted(() => {
                window.removeEventListener('resize', handleResize);
            });
        });

        const sidebarClasses = Vue.computed(() => {
            if (isMobile.value) {
                // Mobile: overlay sidebar
                return [
                    'fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300',
                    props.isOpen ? 'translate-x-0' : '-translate-x-full'
                ];
            } else {
                // Desktop: static sidebar
                return 'w-64 bg-white border-r border-gray-200 flex flex-col h-screen';
            }
        });

        // Usage permissions
        const canUpload = Vue.computed(() => {
            const usage = store.state.usage?.storage;
            return !usage || usage.used < usage.limit;
        });

        const canPractice = Vue.computed(() => {
            return store.state.statistics?.totalQuestions > 0;
        });

        // Methods
        const getUserInitials = () => {
            const user = store.state.user;
            if (!user) return 'U';
            const first = user.firstName?.[0] || '';
            const last = user.lastName?.[0] || '';
            return (first + last).toUpperCase() || 'U';
        };

        const getNavItemClass = (view) => {
            const isActive = store.state.currentView === view;
            const baseClasses = 'w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors';
            
            if (isActive) {
                return baseClasses + ' bg-blue-100 text-blue-700 border border-blue-200';
            } else {
                return baseClasses + ' text-gray-700 hover:bg-gray-100';
            }
        };

        const navigateTo = (view) => {
            store.setCurrentView(view);
            // Close mobile sidebar after navigation
            if (isMobile.value) {
                emit('close');
            }
        };

        const closeSidebar = () => {
            emit('close');
        };

        const refreshAI = async () => {
            try {
                await store.updateAiServiceStatus();
                store.showNotification('AI status refreshed', 'success');
            } catch (error) {
                store.setAiOnline(false);
                store.showNotification('AI service is offline', 'warning');
            }
        };

        const showUpgrade = () => {
            store.showNotification('Upgrade to Pro for unlimited usage! Contact support for Pro access.', 'info');
        };

        return {
            store,
            isMobile,
            sidebarClasses,
            canUpload,
            canPractice,
            getUserInitials,
            getNavItemClass,
            navigateTo,
            closeSidebar,
            refreshAI,
            showUpgrade
        };
    }
};