// src/frontend/components/UI/BetaBadge.js - Beta Version Badge
window.BetaBadgeComponent = {
    template: `
        <div v-if="showBadge" class="fixed top-4 right-4 z-50">
            <div class="flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full shadow-lg text-sm font-bold animate-pulse">
                <i class="fas fa-flask mr-1"></i>
                BETA
            </div>
            
            <!-- Beta Welcome Modal -->
            <div v-if="showWelcome" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
                <div class="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
                    <div class="text-center mb-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-flask text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900">{{ welcomeConfig.title }}</h3>
                    </div>
                    
                    <div class="text-center mb-6">
                        <p class="text-gray-600 mb-4">{{ welcomeConfig.message }}</p>
                        
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <p class="text-sm text-orange-700">
                                <strong>Help us improve:</strong> Share your feedback and report any issues you encounter!
                            </p>
                        </div>
                        
                        <div class="text-xs text-gray-500">
                            Version: {{ appVersion }} | Environment: {{ environment }}
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button @click="dismissWelcome" class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Got it!
                        </button>
                        <button @click="provideFeedback" class="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg">
                            Give Feedback
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

    setup() {
        const showBadge = Vue.ref(false);
        const showWelcome = Vue.ref(false);
        const welcomeConfig = Vue.ref({
            title: 'Welcome to StudyBuddy Beta!',
            message: 'Thanks for testing StudyBuddy! We\'d love your feedback as we improve the platform.'
        });
        const appVersion = Vue.ref('1.0.0-beta');
        const environment = Vue.ref('development');

        // Check configuration when component mounts
        Vue.onMounted(() => {
            checkBetaStatus();
            
            // Listen for config updates
            window.addEventListener('configLoaded', () => {
                checkBetaStatus();
            });
        });

        const checkBetaStatus = () => {
            const config = window.configManager?.getConfig();
            const uiConfig = window.configManager?.getUIConfig() || {};
            const notificationConfig = window.configManager?.getNotificationConfig() || {};
            const appInfo = window.configManager?.getAppInfo() || {};
            
            // Show beta badge if configured
            showBadge.value = uiConfig.showBetaBadge === true;
            
            // Update app info
            appVersion.value = appInfo.version || '1.0.0-beta';
            environment.value = appInfo.environment || 'development';
            
            // Show welcome message if configured and not already shown
            const welcomeMessage = notificationConfig.welcomeMessage;
            if (welcomeMessage?.enabled && welcomeMessage.showOnLogin) {
                const hasSeenWelcome = localStorage.getItem('beta_welcome_seen');
                if (!hasSeenWelcome) {
                    welcomeConfig.value = {
                        title: welcomeMessage.title || 'Welcome to StudyBuddy Beta!',
                        message: welcomeMessage.message || 'Thanks for testing StudyBuddy!'
                    };
                    
                    // Show welcome after a short delay
                    setTimeout(() => {
                        showWelcome.value = true;
                    }, 1000);
                }
            }
        };

        const dismissWelcome = () => {
            showWelcome.value = false;
            localStorage.setItem('beta_welcome_seen', 'true');
        };

        const provideFeedback = () => {
            // Open feedback form or redirect to feedback URL
            const feedbackUrl = 'https://github.com/your-repo/issues'; // Replace with actual URL
            window.open(feedbackUrl, '_blank');
            dismissWelcome();
        };

        return {
            showBadge,
            showWelcome,
            welcomeConfig,
            appVersion,
            environment,
            dismissWelcome,
            provideFeedback
        };
    }
};

console.log('✅ BetaBadge component loaded');