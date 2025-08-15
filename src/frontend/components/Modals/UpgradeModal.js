// components/Modals/UpgradeModal.js - Pro Upgrade Modal
window.UpgradeModalComponent = {
    template: `
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="close">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <button @click="close" class="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                    <i class="fas fa-times text-xl"></i>
                </button>
                
                <div class="relative">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-crown text-2xl"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">Upgrade to StudyBuddy Pro</h2>
                            <p class="opacity-90">Unlock unlimited learning potential</p>
                        </div>
                    </div>
                    
                    <!-- Current Plan Badge -->
                    <div class="inline-flex items-center bg-white/20 rounded-full px-3 py-1 text-sm">
                        <span class="w-2 h-2 bg-white rounded-full mr-2"></span>
                        Currently on {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }} Plan
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6">
                <!-- Pro Benefits -->
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">What you'll get with Pro:</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-ad text-purple-600 text-sm"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">Ad-Free Experience</h4>
                                <p class="text-sm text-gray-600">Study without interruptions or distractions</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-infinity text-blue-600 text-sm"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">Unlimited Questions</h4>
                                <p class="text-sm text-gray-600">Generate as many practice questions as you need</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-folder-plus text-green-600 text-sm"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">Unlimited Topics</h4>
                                <p class="text-sm text-gray-600">Create topics for all your subjects</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-hdd text-yellow-600 text-sm"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">Unlimited Storage</h4>
                                <p class="text-sm text-gray-600">Upload all your study materials</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg">
                            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-chart-line text-indigo-600 text-sm"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">Advanced Analytics</h4>
                                <p class="text-sm text-gray-600">Detailed progress tracking and insights</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 p-4 bg-pink-50 rounded-lg">
                            <div class="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-headset text-pink-600 text-sm"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">Priority Support</h4>
                                <p class="text-sm text-gray-600">Get help when you need it most</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current Usage Summary -->
                <div v-if="store.state.usage" class="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 class="font-medium text-orange-800 mb-3">Your Current Usage:</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div class="text-center">
                            <div class="font-bold text-orange-700">
                                {{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}
                            </div>
                            <div class="text-orange-600">Questions Used</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-orange-700">
                                {{ store.state.usage?.topics?.used || 0 }}/{{ store.state.usage?.topics?.limit || 3 }}
                            </div>
                            <div class="text-orange-600">Topics Created</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-orange-700">
                                {{ Math.round((store.state.usage?.storage?.used || 0) / (1024 * 1024)) }}MB/{{ Math.round((store.state.usage?.storage?.limit || 50 * 1024 * 1024) / (1024 * 1024)) }}MB
                            </div>
                            <div class="text-orange-600">Storage Used</div>
                        </div>
                    </div>
                </div>

                <!-- Pricing -->
                <div class="text-center mb-8">
                    <div class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                        <div class="mb-2">
                            <span class="text-3xl font-bold">$9.99</span>
                            <span class="text-lg opacity-80">/month</span>
                        </div>
                        <div class="text-sm opacity-90">Coming Soon - Early Bird Pricing!</div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-3">
                    <button 
                        @click="joinWaitlist"
                        class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                    >
                        <i class="fas fa-rocket mr-2"></i>
                        Join Pro Waitlist
                    </button>
                    <button 
                        @click="close"
                        class="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
                
                <!-- Additional Info -->
                <div class="mt-6 text-center text-sm text-gray-500">
                    <p>🔒 No commitment required • Cancel anytime • 30-day money-back guarantee</p>
                    <p class="mt-2">Pro features will be available soon. Join the waitlist for early access!</p>
                </div>
            </div>
        </div>
    </div>
    `,

    props: {
        show: {
            type: Boolean,
            default: false
        },
        reason: {
            type: String,
            default: 'general'
        }
    },

    setup(props, { emit }) {
        const store = window.store;
        
        const close = () => {
            emit('close');
        };

        const joinWaitlist = () => {
            // Track waitlist interest
            try {
                if (window.analytics && window.analytics.track) {
                    window.analytics.track('pro_waitlist_join', {
                        reason: props.reason,
                        currentTier: store.state.subscriptionTier,
                        usage: store.state.usage
                    });
                }
                
                console.log(`📊 Pro waitlist interest:`, {
                    reason: props.reason,
                    tier: store.state.subscriptionTier
                });
            } catch (error) {
                console.warn('Analytics tracking failed:', error);
            }

            // Show success message
            store.showNotification(
                'Thanks for your interest! We\'ll notify you when StudyBuddy Pro is available. In the meantime, enjoy the free tier!',
                'success'
            );
            
            // You could also integrate with an email service here
            // Example: window.emailService.addToWaitlist(store.state.user?.email)
            
            close();
        };

        return {
            store,
            close,
            joinWaitlist
        };
    }
};