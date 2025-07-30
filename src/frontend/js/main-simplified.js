// js/main-simplified.js - Main Vue Application with Authentication Integration

const { createApp } = Vue;

// Login Form Component
const LoginFormComponent = {
    template: `
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-brain text-white text-2xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Sign In to StudyAI</h2>
            <p class="text-gray-600 mt-2">Continue your learning journey</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
                <input
                    v-model="email"
                    type="email"
                    placeholder="Email address"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                />
            </div>
            
            <div>
                <input
                    v-model="password"
                    type="password"
                    placeholder="Password"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                />
            </div>
            
            <button
                type="submit"
                :disabled="isLoading || !email || !password"
                class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-sign-in-alt mr-2"></i>
                {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
        </form>
        
        <div class="mt-6 text-center">
            <p class="text-gray-600">
                Don't have an account? 
                <button 
                    @click="$emit('switch-to-register')" 
                    class="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                >
                    Sign up here
                </button>
            </p>
        </div>
    </div>
    `,
    
    setup(props, { emit }) {
        const store = window.store;
        const email = Vue.ref('');
        const password = Vue.ref('');
        const isLoading = Vue.ref(false);

        const handleLogin = async () => {
            if (!email.value || !password.value) return;
            
            isLoading.value = true;
            try {
                await store.login(email.value, password.value);
                emit('login-success');
            } catch (error) {
                // Error handling done in store
                console.error('Login failed:', error);
            } finally {
                isLoading.value = false;
            }
        };

        return {
            email,
            password,
            isLoading,
            handleLogin
        };
    },
    
    emits: ['switch-to-register', 'login-success']
};

// Register Form Component
const RegisterFormComponent = {
    template: `
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-brain text-white text-2xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Join StudyAI</h2>
            <p class="text-gray-600 mt-2">Start your intelligent learning journey</p>
        </div>
        
        <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <input
                    v-model="firstName"
                    type="text"
                    placeholder="First name"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                />
                <input
                    v-model="lastName"
                    type="text"
                    placeholder="Last name"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                />
            </div>
            
            <div>
                <input
                    v-model="username"
                    type="text"
                    placeholder="Username"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                />
            </div>
            
            <div>
                <input
                    v-model="email"
                    type="email"
                    placeholder="Email address"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                />
            </div>
            
            <div>
                <input
                    v-model="password"
                    type="password"
                    placeholder="Password (min 8 characters)"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                    minlength="8"
                />
            </div>
            
            <button
                type="submit"
                :disabled="isLoading || !isFormValid"
                class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-user-plus mr-2"></i>
                {{ isLoading ? 'Creating account...' : 'Create Account' }}
            </button>
        </form>
        
        <div class="mt-6 text-center">
            <p class="text-gray-600">
                Already have an account? 
                <button 
                    @click="$emit('switch-to-login')" 
                    class="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                >
                    Sign in here
                </button>
            </p>
        </div>
        
        <div class="mt-6 text-center">
            <p class="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
        </div>
    </div>
    `,
    
    setup(props, { emit }) {
        const store = window.store;
        const firstName = Vue.ref('');
        const lastName = Vue.ref('');
        const username = Vue.ref('');
        const email = Vue.ref('');
        const password = Vue.ref('');
        const isLoading = Vue.ref(false);

        const isFormValid = Vue.computed(() => {
            return firstName.value && lastName.value && username.value && 
                   email.value && password.value && password.value.length >= 8;
        });

        const handleRegister = async () => {
            if (!isFormValid.value) return;
            
            isLoading.value = true;
            try {
                await store.register({
                    firstName: firstName.value,
                    lastName: lastName.value,
                    username: username.value,
                    email: email.value,
                    password: password.value
                });
                emit('register-success');
            } catch (error) {
                // Error handling done in store
                console.error('Registration failed:', error);
            } finally {
                isLoading.value = false;
            }
        };

        return {
            firstName,
            lastName,
            username,
            email,
            password,
            isLoading,
            isFormValid,
            handleRegister
        };
    },
    
    emits: ['switch-to-login', 'register-success']
};

// Usage Indicator Component
const UsageIndicatorComponent = {
    template: `
    <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <h4 class="font-medium text-gray-900 mb-3 flex items-center">
            <i class="fas fa-chart-bar mr-2 text-primary-500"></i>
            Usage This Month
        </h4>
        
        <!-- Questions Usage -->
        <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Questions Generated</span>
                <span class="font-medium">{{ store.state.usage.questions.used }}/{{ store.state.usage.questions.limit }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                    class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: questionsPercentage + '%' }"
                ></div>
            </div>
        </div>
        
        <!-- Storage Usage -->
        <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Storage Used</span>
                <span class="font-medium">{{ store.state.usage.storage.usedMB }}MB/{{ store.state.usage.storage.limitMB }}MB</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                    class="bg-green-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: storagePercentage + '%' }"
                ></div>
            </div>
        </div>
        
        <!-- Subscription Tier -->
        <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-gray-600">Plan</span>
            <span :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                store.state.subscriptionTier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
            ]">
                {{ store.state.subscriptionTier.toUpperCase() }}
            </span>
        </div>
        
        <!-- Upgrade CTA for Free Users -->
        <div v-if="store.state.subscriptionTier === 'free'" class="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p class="text-sm text-purple-800 mb-2 font-medium">Ready for more?</p>
            <p class="text-xs text-purple-600 mb-3">Upgrade to Pro for 1500 questions/month, unlimited topics, and 5GB storage!</p>
            <button 
                @click="$emit('upgrade-clicked')"
                class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-300"
            >
                Upgrade to Pro
            </button>
        </div>
    </div>
    `,
    
    setup(props, { emit }) {
        const store = window.store;

        const questionsPercentage = Vue.computed(() => {
            const usage = store.state.usage.questions;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const storagePercentage = Vue.computed(() => {
            const usage = store.state.usage.storage;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        return {
            store,
            questionsPercentage,
            storagePercentage
        };
    },
    
    emits: ['upgrade-clicked']
};

// Main App Component
const App = {
    template: `
    <div class="min-h-screen">
        <!-- Authentication Screen -->
        <div v-if="!store.state.isAuthenticated && !store.state.authLoading" 
             class="min-h-screen bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center p-4">
            
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div>
            </div>
            
            <!-- Auth Forms -->
            <div class="relative z-10 w-full max-w-md">
                <LoginFormComponent 
                    v-if="authMode === 'login'" 
                    @login-success="onAuthSuccess" 
                    @switch-to-register="authMode = 'register'" 
                />
                <RegisterFormComponent 
                    v-else 
                    @register-success="onAuthSuccess" 
                    @switch-to-login="authMode = 'login'" 
                />
            </div>
        </div>

        <!-- Loading Screen -->
        <div v-else-if="store.state.authLoading" 
             class="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <div class="text-center text-white">
                <div class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 class="text-xl font-semibold mb-2">Loading StudyAI...</h2>
                <p class="text-white/80">Setting up your workspace</p>
            </div>
        </div>
        
        <!-- Authenticated App -->
        <div v-else class="flex h-screen bg-gray-50">
            <!-- Sidebar -->
            <SidebarSimplifiedComponent />

            <!-- Main Content -->
            <div class="flex-1 flex flex-col overflow-hidden">
                <!-- Header -->
                <HeaderSimplifiedComponent />

                <!-- Content Area -->
                <main class="flex-1 overflow-auto">
                    <div class="p-6">
                        <!-- Dashboard View -->
                        <DashboardSimplifiedComponent v-if="store.state.currentView === 'dashboard'" />
                        
                        <!-- Subjects List View (Fixed Subjects) -->
                        <FixedSubjectsListComponent v-if="store.state.currentView === 'subjects' && !store.state.selectedSubject" />
                        
                        <!-- Topics View (When Subject Selected) -->
                        <TopicsListSimplifiedComponent v-if="store.state.currentView === 'subjects' && store.state.selectedSubject" />
                        
                        <!-- Topics View (Alternative Route) -->
                        <TopicsListSimplifiedComponent v-if="store.state.currentView === 'topics'" />
                        
                        <!-- Upload View -->
                        <UploadFormSimplifiedComponent v-if="store.state.currentView === 'upload'" />
                        
                        <!-- Practice View -->
                        <PracticeSetupSimplifiedComponent v-if="store.state.currentView === 'practice'" />
                    </div>
                </main>
                
                <!-- Usage Indicator (Floating) -->
                <div class="fixed bottom-4 right-4 z-40 w-80 hidden lg:block">
                    <UsageIndicatorComponent @upgrade-clicked="showUpgradeModal" />
                </div>
            </div>

            <!-- Modals -->
            <!-- Topic Creation Modal -->
            <CreateTopicModal v-if="store.state.showCreateTopicModal" />

            <!-- Notifications -->
            <NotificationsComponent />
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const authMode = Vue.ref('login');

        // Initialize app
        Vue.onMounted(async () => {
            await initializeApp();
        });

        const initializeApp = async () => {
            try {
                console.log('🚀 Initializing StudyAI with Authentication...');
                
                // Check AI service health (non-authenticated endpoint)
                try {
                    await window.api.checkHealth();
                    store.setAiOnline(true);
                    console.log('✅ AI service is online');
                } catch (error) {
                    console.warn('⚠️ AI service not available:', error);
                    store.setAiOnline(false);
                }

                // If user is already authenticated, load their data
                if (store.state.isAuthenticated) {
                    await loadUserData();
                }

                console.log('✅ StudyAI initialized successfully!');

            } catch (error) {
                console.error('❌ Failed to initialize app:', error);
                store.showNotification('Failed to initialize application: ' + error.message, 'error');
            }
        };

        const loadUserData = async () => {
            try {
                // Load user's topics if a subject is selected
                if (store.state.selectedSubject) {
                    console.log('📂 Loading topics for selected subject...');
                    const topics = await window.api.getTopics(store.state.selectedSubject.id);
                    store.state.topics = topics;
                    console.log(`✅ Loaded ${topics.length} topics`);
                }

                // Load dashboard statistics
                await store.updateStatistics();
                
                // Load usage statistics
                await store.loadUsageStats();

                console.log('✅ User data loaded successfully');
                
            } catch (error) {
                console.warn('⚠️ Failed to load some user data:', error);
            }
        };

        const onAuthSuccess = async () => {
            store.setCurrentView('dashboard');
            await loadUserData();
        };

        const showUpgradeModal = () => {
            store.showNotification('Upgrade feature coming soon! Contact support for Pro access.', 'info');
        };

        // Global error handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Handle auth errors globally
            if (event.reason?.message?.includes('Authentication required')) {
                store.logout();
                store.showNotification('Session expired. Please log in again.', 'warning');
            } else {
                store.showNotification('An unexpected error occurred', 'error');
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            store.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            store.showNotification('Working offline - some features may be limited', 'warning');
        });

        // Periodic health checks and token refresh
        setInterval(async () => {
            if (store.state.isAuthenticated) {
                // Check AI status
                try {
                    await window.api.checkHealth();
                    if (!store.state.aiOnline) {
                        store.setAiOnline(true);
                        store.showNotification('AI service is back online!', 'success');
                    }
                } catch (error) {
                    if (store.state.aiOnline) {
                        store.setAiOnline(false);
                        store.showNotification('AI service went offline', 'warning');
                    }
                }
            }
        }, 60000); // Check every minute

        return {
            store,
            authMode,
            onAuthSuccess,
            showUpgradeModal
        };
    }
};

// Register all components with authentication support
const app = createApp(App);

// Authentication components
app.component('LoginFormComponent', LoginFormComponent);
app.component('RegisterFormComponent', RegisterFormComponent);
app.component('UsageIndicatorComponent', UsageIndicatorComponent);

// Layout components (existing)
app.component('SidebarSimplifiedComponent', window.SidebarSimplifiedComponent);
app.component('HeaderSimplifiedComponent', window.HeaderSimplifiedComponent);
app.component('NotificationsComponent', window.NotificationsComponent);

// Main page components (existing)
app.component('DashboardSimplifiedComponent', window.SimplifiedDashboardComponent);
app.component('FixedSubjectsListComponent', window.FixedSubjectsListComponent);
app.component('TopicsListSimplifiedComponent', window.TopicsListSimplifiedComponent);
app.component('UploadFormSimplifiedComponent', window.UploadFormSimplifiedComponent);
app.component('PracticeSetupSimplifiedComponent', window.PracticeSetupSimplifiedComponent);

// Practice components (existing)
app.component('MCQQuestionCard', window.MCQQuestionCard);

// Modal components (existing)
app.component('CreateTopicModal', window.CreateTopicModal);

// Utility components (existing)
app.component('FileDropzone', window.FileDropzone);

// Global properties
app.config.globalProperties.$store = window.store;
app.config.globalProperties.$api = window.api;

// Mount the app
app.mount('#app');

// Global keyboard shortcuts (updated for auth)
document.addEventListener('keydown', (event) => {
    // Only allow shortcuts if authenticated
    if (!window.store.state.isAuthenticated) return;
    
    // Ctrl/Cmd + U - Upload
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        window.store.setCurrentView('upload');
    }
    
    // Ctrl/Cmd + P - Practice
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        window.store.setCurrentView('practice');
    }
    
    // Ctrl/Cmd + H - Home/Dashboard
    if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        window.store.setCurrentView('dashboard');
    }
    
    // Ctrl/Cmd + S - Subjects
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        window.store.setCurrentView('subjects');
    }
    
    // Ctrl/Cmd + T - Add Topic (only if subject selected)
    if ((event.ctrlKey || event.metaKey) && event.key === 't' && window.store.state.selectedSubject) {
        event.preventDefault();
        window.store.showCreateTopicModal();
    }
    
    // Ctrl/Cmd + L - Logout
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        window.store.logout();
    }
    
    // Escape - Close modals
    if (event.key === 'Escape') {
        if (window.store.state.showCreateTopicModal) {
            window.store.hideCreateTopicModal();
        }
    }
    
    // Space - Start practice if possible
    if (event.key === ' ' && !event.target.matches('input, textarea') && window.store.state.selectedTopic) {
        event.preventDefault();
        window.store.setCurrentView('practice');
    }
});

// Global utilities available in console for debugging (updated for auth)
window.studyAI = {
    store: window.store,
    api: window.api,
    debug: () => {
        console.group('📊 StudyAI Debug Information (With Auth)');
        console.log('Authentication Status:', window.store.state.isAuthenticated);
        console.log('Current User:', window.store.state.user?.email);
        console.log('Subscription Tier:', window.store.state.subscriptionTier);
        console.log('Usage Stats:', window.store.state.usage);
        console.log('Current View:', window.store.state.currentView);
        console.log('Selected Subject:', window.store.state.selectedSubject?.name);
        console.log('Selected Topic:', window.store.state.selectedTopic?.name);
        console.log('Fixed Subjects:', window.store.state.subjects.length);
        console.log('Topics:', window.store.state.topics.length);
        console.log('Questions:', window.store.state.questions.length);
        console.log('Practice Started:', window.store.state.practiceStarted);
        console.log('AI Online:', window.store.state.aiOnline);
        console.log('Statistics:', window.store.state.statistics);
        console.groupEnd();
    },
    login: async (email, password) => {
        try {
            await window.store.login(email, password);
            console.log('✅ Login successful via console');
        } catch (error) {
            console.error('❌ Console login failed:', error);
        }
    },
    logout: () => {
        window.store.logout();
        console.log('✅ Logged out via console');
    },
    register: async (userData) => {
        try {
            await window.store.register(userData);
            console.log('✅ Registration successful via console');
        } catch (error) {
            console.error('❌ Console registration failed:', error);
        }
    },
    usage: () => {
        console.log('📊 Current Usage:', window.store.state.usage);
        return window.store.state.usage;
    },
    export: async () => {
        try {
            const data = await window.api.exportData();
            console.log('📤 Export data:', data);
            return data;
        } catch (error) {
            console.error('❌ Export failed:', error);
        }
    },
    testAI: async () => {
        try {
            const result = await window.api.checkHealth();
            console.log('🤖 AI Health:', result);
            return result;
        } catch (error) {
            console.error('❌ AI Health check failed:', error);
        }
    },
    version: '2.0-with-auth',
    help: () => {
        console.log(`
🧠 StudyAI with Authentication - Console Commands:

Authentication:
studyAI.login(email, password)  - Login via console
studyAI.register(userData)      - Register via console  
studyAI.logout()               - Logout via console

Data & Debug:
studyAI.debug()                - Show current application state
studyAI.usage()                - Show usage statistics
studyAI.export()               - Export user data as JSON
studyAI.testAI()               - Test AI service connection
studyAI.help()                 - Show this help

Keyboard Shortcuts (when authenticated):
Ctrl+H - Dashboard
Ctrl+S - Subjects  
Ctrl+U - Upload
Ctrl+P - Practice
Ctrl+T - Add Topic (if subject selected)
Ctrl+L - Logout
Space  - Start Practice (if topic selected)
Esc    - Close modals

Current Status:
- Authentication: ${window.store.state.isAuthenticated ? '✅ Logged in' : '❌ Not authenticated'}
- User: ${window.store.state.user?.email || 'None'}
- Subscription: ${window.store.state.subscriptionTier.toUpperCase()}
- AI Service: ${window.store.state.aiOnline ? '✅ Online' : '❌ Offline'}
        `);
    }
};

// Show initialization success message
console.log(`
🎓 StudyAI with Authentication v2.0 loaded successfully!

New Features:
✅ User Authentication & Registration
✅ Subscription Tiers (Free/Pro)
✅ Usage Tracking & Limits
✅ Cloud Data Storage
✅ Secure API Communication
✅ Session Management

Current Status:
- Authentication: ${window.store.state.isAuthenticated ? 'Logged in' : 'Ready for login'}
- AI Service: ${window.store.state.aiOnline ? 'Online' : 'Checking...'}

Type 'studyAI.help()' in console for available commands
`);

console.log('🧠 StudyAI with Authentication loaded successfully!');
console.log('📝 Use: studyAI.help() for available commands');