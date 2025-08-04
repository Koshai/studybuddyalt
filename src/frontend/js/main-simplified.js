// js/main-simplified.js - Main Vue Application with Full Authentication & Usage Integration

const { createApp } = Vue;

// Main App Component with Enhanced Authentication
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
            
            <!-- Auth Forms Container -->
            <div class="relative z-10 w-full max-w-md">
                <!-- Email Confirmation Form -->
                <div v-if="authMode === 'confirm-email'" class="animate-fade-in">
                    <EmailConfirmationComponent 
                        :email="confirmationEmail"
                        :initial-confirmation-code="confirmationCode"
                        @back-to-login="authMode = 'login'; confirmationEmail = ''; confirmationCode = ''"
                        @switch-to-register="authMode = 'register'; confirmationEmail = ''; confirmationCode = ''"
                        @email-confirmed="onEmailConfirmed"
                    />
                </div>
                
                <!-- Login Form -->
                <div v-else-if="authMode === 'login'" class="animate-fade-in">
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
                                    v-model="loginEmail"
                                    type="email"
                                    placeholder="Email address"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    required
                                />
                            </div>
                            
                            <div>
                                <input
                                    v-model="loginPassword"
                                    type="password"
                                    placeholder="Password"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    required
                                />
                            </div>
                            
                            <button
                                type="submit"
                                :disabled="loginLoading || !loginEmail || !loginPassword"
                                class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                <i v-if="loginLoading" class="fas fa-spinner fa-spin mr-2"></i>
                                <i v-else class="fas fa-sign-in-alt mr-2"></i>
                                {{ loginLoading ? 'Signing in...' : 'Sign In' }}
                            </button>
                        </form>
                        
                        <div class="mt-6 text-center">
                            <p class="text-gray-600">
                                Don't have an account? 
                                <button 
                                    @click="authMode = 'register'" 
                                    class="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                                >
                                    Sign up here
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Register Form -->
                <div v-else class="animate-fade-in">
                    <RegisterFormComponent 
                        @register-success="onRegisterSuccess" 
                        @switch-to-login="authMode = 'login'" 
                    />
                </div>
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
            <!-- Enhanced Sidebar -->
            <SidebarSimplifiedComponent />

            <!-- Main Content -->
            <div class="flex-1 flex flex-col overflow-hidden">
                <!-- Enhanced Header -->
                <HeaderSimplifiedComponent />

                <!-- Content Area -->
                <main class="flex-1 overflow-auto">
                    <div class="p-6">
                        <!-- Enhanced Dashboard View -->
                        <DashboardSimplifiedComponent v-if="store.state.currentView === 'dashboard'" />
                        
                        <!-- Subjects List View (Fixed Subjects) -->
                        <FixedSubjectsListComponent v-if="store.state.currentView === 'subjects' && !store.state.selectedSubject" />
                        
                        <!-- Topics View (When Subject Selected) -->
                        <TopicsListSimplifiedComponent v-if="store.state.currentView === 'subjects' && store.state.selectedSubject" />
                        
                        <!-- Topics View (Alternative Route) -->
                        <TopicsListSimplifiedComponent v-if="store.state.currentView === 'topics'" />
                        
                        <!-- Enhanced Upload View -->
                        <UploadFormSimplifiedComponent v-if="store.state.currentView === 'upload'" />
                        
                        <!-- Enhanced Practice View -->
                        <PracticeSetupSimplifiedComponent v-if="store.state.currentView === 'practice'" />
                        
                        <!-- Practice Session View -->
                        <PracticeSessionComponent v-if="store.state.currentView === 'practice-session'" />
                        
                        <!-- Browse Practice Topics View -->
                        <BrowsePracticeTopicsComponent v-if="store.state.currentView === 'browse-practice'" />
                        
                        <!-- Notes Management View -->
                        <NotesDisplayComponent v-if="store.state.currentView === 'notes'" 
                                             :topic-id="store.state.selectedTopic?.id" 
                                             :subject-id="store.state.selectedSubject?.id" />
                    </div>
                </main>
                
                <!-- Usage Indicator (Floating) - Desktop Collapsible -->
                <div class="fixed bottom-4 right-4 z-40 hidden xl:block">
                    <!-- Collapsed Usage Button -->
                    <div v-if="!showDesktopUsage" class="w-12 h-12">
                        <button 
                            @click="showDesktopUsage = true"
                            class="bg-white border border-gray-200 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 w-full h-full flex items-center justify-center"
                            title="View Usage Statistics"
                        >
                            <i class="fas fa-chart-bar text-gray-600"></i>
                        </button>
                    </div>
                    
                    <!-- Expanded Usage Panel -->
                    <div v-if="showDesktopUsage" class="w-80 relative">
                        <div class="absolute top-2 right-2 z-50">
                            <button 
                                @click="showDesktopUsage = false"
                                class="bg-gray-100 hover:bg-gray-200 rounded-full p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Minimize Usage Panel"
                            >
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </div>
                        <UsageIndicatorComponent @upgrade-clicked="showUpgradeModal" />
                    </div>
                </div>
                
                <!-- Mobile Usage Indicator -->
                <div class="xl:hidden fixed bottom-4 right-4 z-40">
                    <button 
                        @click="showMobileUsage = !showMobileUsage"
                        class="bg-white border border-gray-200 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <i class="fas fa-chart-bar text-gray-600"></i>
                    </button>
                    
                    <!-- Mobile Usage Popup -->
                    <div v-if="showMobileUsage" 
                         class="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
                         @click.stop>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium text-gray-900">Usage This Month</h4>
                            <button @click="showMobileUsage = false" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <!-- Mini Usage Stats -->
                        <div class="space-y-3">
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-600">Questions</span>
                                    <span class="font-medium">{{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                                         :style="{ width: Math.min((store.state.usage?.questions?.used || 0) / (store.state.usage?.questions?.limit || 50) * 100, 100) + '%' }"></div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-600">Storage</span>
                                    <span class="font-medium">{{ Math.round((store.state.usage?.storage?.used || 0) / (1024 * 1024)) }}MB</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                         :style="{ width: Math.min((store.state.usage?.storage?.used || 0) / (store.state.usage?.storage?.limit || 104857600) * 100, 100) + '%' }"></div>
                                </div>
                            </div>
                            
                            <div class="pt-2 border-t border-gray-200">
                                <span :class="[
                                    'px-3 py-1 rounded-full text-xs font-medium',
                                    store.state.subscriptionTier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                ]">
                                    {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }} PLAN
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modals -->
            <!-- Topic Creation Modal -->
            <CreateTopicModal v-if="store.state.showCreateTopicModal" />

            <!-- Enhanced Notifications -->
            <NotificationsComponent />
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const authMode = Vue.ref('login');
        const showMobileUsage = Vue.ref(false);
        const showDesktopUsage = Vue.ref(false);
        
        // Login form state
        const loginEmail = Vue.ref('');
        const loginPassword = Vue.ref('');
        const loginLoading = Vue.ref(false);
        
        // Email confirmation state
        const confirmationEmail = Vue.ref('');
        const confirmationCode = Vue.ref('');

        // Initialize app
        Vue.onMounted(async () => {
            await initializeApp();
        });

        const initializeApp = async () => {
            try {
                console.log('🚀 Initializing StudyAI with Enhanced Authentication...');
                
                // Check AI service health with detailed status
                try {
                    await store.updateAiServiceStatus();
                    console.log(`✅ AI service is online using ${store.state.aiService.toUpperCase()}`);
                } catch (error) {
                    console.warn('⚠️ AI service not available:', error);
                    store.setAiOnline(false);
                }

                // If user is already authenticated, load their data
                if (store.state.isAuthenticated) {
                    await loadUserData();
                }

                console.log('✅ StudyAI Enhanced initialized successfully!');

            } catch (error) {
                console.error('❌ Failed to initialize app:', error);
                store.showNotification('Failed to initialize application: ' + error.message, 'error');
            }
        };

        const loadUserData = async () => {
            try {
                console.log('📊 Loading user data and usage statistics...');
                
                // Load user's topics if a subject is selected
                if (store.state.selectedSubject) {
                    console.log('📂 Loading topics for selected subject...');
                    const topics = await window.api.getTopics(store.state.selectedSubject.id);
                    store.state.topics = topics;
                    console.log(`✅ Loaded ${topics.length} topics`);
                }

                // Load dashboard statistics
                await store.updateStatistics();
                
                // Load usage statistics (enhanced)
                await store.loadUsageStats();

                console.log('✅ User data and usage stats loaded successfully');
                
            } catch (error) {
                console.warn('⚠️ Failed to load some user data:', error);
            }
        };

        const handleLogin = async () => {
            if (!loginEmail.value || !loginPassword.value) return;
            
            loginLoading.value = true;
            try {
                await store.login(loginEmail.value, loginPassword.value);
                await onAuthSuccess();
            } catch (error) {
                console.error('Login failed:', error);
                
                // Check if it's an email confirmation error
                if (error.message?.includes('check your email') || 
                    error.message?.includes('confirmation') || 
                    error.message?.includes('Email not confirmed')) {
                    
                    console.log('🔄 Switching to email confirmation mode');
                    confirmationEmail.value = loginEmail.value;
                    authMode.value = 'confirm-email';
                    store.showNotification('Please confirm your email address to continue', 'info');
                }
                // Other error handling is done in store
            } finally {
                loginLoading.value = false;
            }
        };

        const onAuthSuccess = async () => {
            console.log('🎉 Authentication successful');
            store.setCurrentView('dashboard');
            await loadUserData();
            
            // Clear login form
            loginEmail.value = '';
            loginPassword.value = '';
            authMode.value = 'login';
        };

        const onRegisterSuccess = (data) => {
            console.log('📝 Registration completed:', data);
            
            if (data && data.needsConfirmation) {
                // Switch to email confirmation mode
                confirmationEmail.value = data.email;
                confirmationCode.value = data.confirmationCode;
                authMode.value = 'confirm-email';
                store.showNotification('Registration successful! Please confirm your email to continue.', 'info');
            } else {
                // Direct login (email already confirmed)
                onAuthSuccess();
            }
        };

        const onEmailConfirmed = () => {
            console.log('✅ Email confirmed, switching back to login');
            authMode.value = 'login';
            // Keep the email filled in for convenience
            loginEmail.value = confirmationEmail.value;
            confirmationEmail.value = '';
            confirmationCode.value = '';
            store.showNotification('Email confirmed! Please sign in now.', 'success');
        };

        const showUpgradeModal = () => {
            store.showNotification('Upgrade to Pro for unlimited usage and premium features! Contact support for Pro access.', 'info');
        };

        // Global error handler (enhanced)
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Handle auth errors globally
            if (event.reason?.message?.includes('Authentication required') || 
                event.reason?.message?.includes('token') || 
                event.reason?.status === 401) {
                store.logout();
                store.showNotification('Session expired. Please log in again.', 'warning');
            } else if (event.reason?.message?.includes('limit')) {
                store.showNotification('Usage limit reached. Consider upgrading to Pro!', 'warning');
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

        // Enhanced periodic health checks and usage refresh
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
                
                // Refresh usage stats every 5 minutes
                if (Date.now() % 300000 < 60000) { // Every 5 minutes
                    try {
                        await store.loadUsageStats();
                    } catch (error) {
                        console.warn('Failed to refresh usage stats:', error);
                    }
                }
            }
        }, 60000); // Check every minute

        // Close mobile usage popup when clicking outside
        const closeMobileUsage = () => {
            showMobileUsage.value = false;
        };

        Vue.onMounted(() => {
            document.addEventListener('click', closeMobileUsage);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('click', closeMobileUsage);
        });

        return {
            store,
            authMode,
            showMobileUsage,
            showDesktopUsage,
            loginEmail,
            loginPassword,
            loginLoading,
            confirmationEmail,
            confirmationCode,
            handleLogin,
            onAuthSuccess,
            onRegisterSuccess,
            onEmailConfirmed,
            showUpgradeModal
        };
    }
};

// Register all components with enhanced authentication support
const app = createApp(App);

// Authentication components
app.component('RegisterFormComponent', window.RegisterFormComponent);
app.component('EmailConfirmationComponent', window.EmailConfirmationComponent);
app.component('UsageIndicatorComponent', window.UsageIndicatorComponent);

// Enhanced Layout components
app.component('SidebarSimplifiedComponent', window.EnhancedSidebarComponent);
app.component('HeaderSimplifiedComponent', window.EnhancedHeaderComponent);
app.component('NotificationsComponent', window.NotificationsComponent);

// Enhanced Main page components
app.component('DashboardSimplifiedComponent', window.EnhancedDashboardComponent);
app.component('FixedSubjectsListComponent', window.FixedSubjectsListComponent);
app.component('TopicsListSimplifiedComponent', window.TopicsListSimplifiedComponent);
app.component('UploadFormSimplifiedComponent', window.EnhancedUploadFormComponent);
app.component('PracticeSetupSimplifiedComponent', window.EnhancedPracticeSetupComponent);
app.component('PracticeSessionComponent', window.PracticeSessionComponent);
app.component('BrowsePracticeTopicsComponent', window.BrowsePracticeTopicsComponent);
app.component('NotesDisplayComponent', window.NotesDisplayComponent);

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

// Enhanced global keyboard shortcuts (updated for auth and usage awareness)
document.addEventListener('keydown', (event) => {
    // Only allow shortcuts if authenticated
    if (!window.store.state.isAuthenticated) return;
    
    // Ctrl/Cmd + U - Upload (if storage available)
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        const storageUsage = window.store.state.usage?.storage;
        if (storageUsage && storageUsage.used >= storageUsage.limit) {
            window.store.showNotification('Storage limit reached! Upgrade to Pro for more storage.', 'warning');
        } else {
            window.store.setCurrentView('upload');
        }
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
    
    // Ctrl/Cmd + T - Add Topic (only if subject selected and within limits)
    if ((event.ctrlKey || event.metaKey) && event.key === 't' && window.store.state.selectedSubject) {
        event.preventDefault();
        const topicUsage = window.store.state.usage?.topics;
        if (topicUsage && topicUsage.used >= topicUsage.limit) {
            window.store.showNotification('Topic limit reached! Upgrade to Pro for unlimited topics.', 'warning');
        } else {
            window.store.showCreateTopicModal();
        }
    }
    
    // Ctrl/Cmd + G - Generate Questions (if within limits)
    if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault();
        const questionUsage = window.store.state.usage?.questions;
        if (questionUsage && questionUsage.used >= questionUsage.limit) {
            window.store.showNotification('Question limit reached! Upgrade to Pro for more questions.', 'warning');
        } else if (window.store.state.statistics?.totalNotes > 0) {
            window.store.setCurrentView('practice');
        } else {
            window.store.showNotification('Upload study materials first to generate questions!', 'info');
            window.store.setCurrentView('upload');
        }
    }
    
    // Ctrl/Cmd + L - Logout
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        if (confirm('Are you sure you want to sign out?')) {
            window.store.logout();
        }
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

// Enhanced global utilities available in console for debugging (updated for auth and usage)
window.studyAI = {
    store: window.store,
    api: window.api,
    debug: () => {
        console.group('📊 StudyAI Enhanced Debug Information');
        console.log('Authentication Status:', window.store.state.isAuthenticated);
        console.log('Current User:', {
            id: window.store.state.user?.id,
            email: window.store.state.user?.email,
            name: `${window.store.state.user?.firstName} ${window.store.state.user?.lastName}`,
            joinDate: window.store.state.user?.createdAt
        });
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
    refreshUsage: async () => {
        try {
            await window.store.loadUsageStats();
            console.log('✅ Usage stats refreshed');
            return window.store.state.usage;
        } catch (error) {
            console.error('❌ Failed to refresh usage stats:', error);
        }
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
    simulateUsage: (type, amount) => {
        // For testing usage limits
        if (window.store.state.usage?.[type]) {
            window.store.state.usage[type].used = Math.min(
                window.store.state.usage[type].used + amount,
                window.store.state.usage[type].limit
            );
            console.log(`📊 Simulated ${amount} ${type} usage. Current: ${window.store.state.usage[type].used}/${window.store.state.usage[type].limit}`);
        }
    },
    version: '2.0-enhanced-with-usage',
    help: () => {
        console.log(`
🧠 StudyAI Enhanced with Authentication & Usage Tracking - Console Commands:

Authentication:
studyAI.login(email, password)      - Login via console
studyAI.register(userData)          - Register via console  
studyAI.logout()                   - Logout via console

Data & Debug:
studyAI.debug()                    - Show current application state
studyAI.usage()                    - Show usage statistics
studyAI.refreshUsage()             - Refresh usage from server
studyAI.export()                   - Export user data as JSON
studyAI.testAI()                   - Test AI service connection
studyAI.simulateUsage(type, amount) - Simulate usage for testing
studyAI.help()                     - Show this help

Keyboard Shortcuts (when authenticated):
Ctrl+H - Dashboard
Ctrl+S - Subjects  
Ctrl+U - Upload (if storage available)
Ctrl+P - Practice
Ctrl+G - Generate Questions (if within limits)
Ctrl+T - Add Topic (if subject selected and within limits)
Ctrl+L - Logout
Space  - Start Practice (if topic selected)
Esc    - Close modals

Current Status:
- Authentication: ${window.store.state.isAuthenticated ? '✅ Logged in' : '❌ Not authenticated'}
- User: ${window.store.state.user?.email || 'None'}
- Subscription: ${window.store.state.subscriptionTier?.toUpperCase() || 'FREE'}
- AI Service: ${window.store.state.aiOnline ? '✅ Online' : '❌ Offline'}
- Usage Tracking: ${window.store.state.usage ? '✅ Active' : '❌ Not loaded'}
        `);
    }
};

// Show enhanced initialization success message
console.log(`
🎓 StudyAI Enhanced with Authentication & Usage Tracking v2.0 loaded successfully!

New Features:
✅ Complete User Authentication & Registration
✅ Subscription Tiers (Free/Pro) with Usage Limits
✅ Real-time Usage Tracking & Analytics
✅ Smart Action Blocking based on Limits
✅ Contextual Upgrade Prompts
✅ Enhanced UI with Usage Indicators
✅ Mobile-Responsive Usage Monitoring
✅ Secure API Communication
✅ Session Management & Auto-refresh

Current Status:
- Authentication: ${window.store.state.isAuthenticated ? 'Logged in' : 'Ready for login'}
- AI Service: ${window.store.state.aiOnline ? 'Online' : 'Checking...'}
- Usage Tracking: Active and Monitoring

Type 'studyAI.help()' in console for available commands
`);

console.log('🧠 StudyAI Enhanced loaded successfully!');
console.log('📝 Use: studyAI.help() for available commands');
console.log('🎯 All enhanced components integrated with usage tracking!');