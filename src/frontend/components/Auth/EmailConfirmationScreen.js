// components/Auth/EmailConfirmationScreen.js - Email Confirmation Waiting Screen
window.EmailConfirmationScreenComponent = {
    template: `
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="mb-8">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-envelope text-white text-3xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p class="text-gray-600">We've sent a confirmation link to your email address</p>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div class="flex items-start space-x-3">
                <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div class="text-left">
                    <p class="text-blue-800 font-medium mb-2">Email sent to:</p>
                    <p class="text-blue-700 text-sm font-mono bg-white px-3 py-2 rounded border">{{ email }}</p>
                </div>
            </div>
        </div>
        
        <div class="space-y-4 mb-8">
            <div class="flex items-center space-x-3 text-gray-700">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-check text-green-600 text-sm"></i>
                </div>
                <div class="text-left">
                    <p class="font-medium">1. Check your inbox</p>
                    <p class="text-sm text-gray-500">Look for an email from StudyAI</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-3 text-gray-700">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-mouse-pointer text-blue-600 text-sm"></i>
                </div>
                <div class="text-left">
                    <p class="font-medium">2. Click the confirmation link</p>
                    <p class="text-sm text-gray-500">This will activate your account</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-3 text-gray-700">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-sign-in-alt text-purple-600 text-sm"></i>
                </div>
                <div class="text-left">
                    <p class="font-medium">3. Return here to sign in</p>
                    <p class="text-sm text-gray-500">Use your email and password to login</p>
                </div>
            </div>
        </div>
        
        <!-- Resend Email Button -->
        <div class="mb-6">
            <button
                @click="resendConfirmationEmail"
                :disabled="isResending || cooldownRemaining > 0"
                class="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 py-3 rounded-lg font-medium transition-colors"
            >
                <i v-if="isResending" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else-if="cooldownRemaining > 0" class="fas fa-clock mr-2"></i>
                <i v-else class="fas fa-paper-plane mr-2"></i>
                <span v-if="cooldownRemaining > 0">Resend in {{ cooldownRemaining }}s</span>
                <span v-else-if="isResending">Sending...</span>
                <span v-else>Resend confirmation email</span>
            </button>
            <p v-if="resendMessage" class="text-sm mt-2" :class="resendSuccess ? 'text-green-600' : 'text-red-600'">
                {{ resendMessage }}
            </p>
        </div>
        
        <!-- Alternative Actions -->
        <div class="space-y-3">
            <button
                @click="handleSignInClick"
                class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-sign-in-alt mr-2"></i>
                I've confirmed my email - Sign In
            </button>
            
            <button
                @click="goToHomePage"
                class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-home mr-2"></i>
                Visit Homepage
            </button>
            
            <button
                @click="$emit('back-to-register')"
                class="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium hover:underline"
            >
                <i class="fas fa-arrow-left mr-1"></i>
                Back to registration
            </button>
        </div>
        
        <!-- Help Text -->
        <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 mb-2">Can't find the email?</p>
            <ul class="text-xs text-gray-500 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Try resending the confirmation email</li>
            </ul>
        </div>
    </div>
    `,
    
    props: {
        email: {
            type: String,
            required: true
        }
    },
    
    setup(props, { emit }) {
        const store = window.store;
        
        // Resend functionality
        const isResending = Vue.ref(false);
        const resendMessage = Vue.ref('');
        const resendSuccess = Vue.ref(false);
        const cooldownRemaining = Vue.ref(0);
        
        let cooldownInterval = null;
        
        const startCooldown = () => {
            cooldownRemaining.value = 60; // 60 second cooldown
            cooldownInterval = setInterval(() => {
                cooldownRemaining.value--;
                if (cooldownRemaining.value <= 0) {
                    clearInterval(cooldownInterval);
                }
            }, 1000);
        };
        
        const resendConfirmationEmail = async () => {
            if (isResending.value || cooldownRemaining.value > 0) return;
            
            isResending.value = true;
            resendMessage.value = '';
            
            try {
                // Call resend endpoint (you'll need to implement this)
                const response = await fetch('/api/auth/resend-confirmation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: props.email })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    resendMessage.value = 'Confirmation email sent successfully!';
                    resendSuccess.value = true;
                    startCooldown();
                } else {
                    resendMessage.value = result.message || 'Failed to resend email. Please try again.';
                    resendSuccess.value = false;
                }
                
            } catch (error) {
                console.error('Resend confirmation error:', error);
                resendMessage.value = 'Network error. Please check your connection and try again.';
                resendSuccess.value = false;
            } finally {
                isResending.value = false;
                
                // Clear message after 5 seconds
                setTimeout(() => {
                    resendMessage.value = '';
                }, 5000);
            }
        };
        
        // Cleanup interval on unmount
        Vue.onUnmounted(() => {
            if (cooldownInterval) {
                clearInterval(cooldownInterval);
            }
        });
        
        const handleSignInClick = () => {
            // Store the email for pre-filling login form
            if (window.store && window.store.state) {
                window.store.state.prefilledEmail = props.email;
            }
            emit('switch-to-login');
        };

        const goToHomePage = () => {
            // Navigate to landing page
            emit('go-to-home');
        };

        return {
            isResending,
            resendMessage,
            resendSuccess,
            cooldownRemaining,
            resendConfirmationEmail,
            handleSignInClick,
            goToHomePage
        };
    },
    
    emits: ['switch-to-login', 'back-to-register', 'go-to-home']
};