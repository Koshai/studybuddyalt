// components/Auth/EmailConfirmation.js - Email Confirmation Component
window.EmailConfirmationComponent = {
    template: `
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-envelope text-white text-2xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Confirm Your Email</h2>
            <p class="text-gray-600 mt-2">We need to verify your email address before you can sign in</p>
        </div>
        
        <!-- Email Display -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <div class="flex items-center">
                <i class="fas fa-user text-gray-400 mr-3"></i>
                <div>
                    <p class="text-sm text-gray-600">Email address</p>
                    <p class="font-medium text-gray-900">{{ email }}</p>
                </div>
            </div>
        </div>
        
        <!-- Confirmation Code Display -->
        <div v-if="currentConfirmationCode" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="text-center">
                <p class="text-blue-700 text-sm font-medium mb-2">Your Confirmation Code:</p>
                <div class="bg-white rounded-lg p-3 border-2 border-blue-300">
                    <span class="text-2xl font-bold text-blue-800 tracking-widest">{{ currentConfirmationCode }}</span>
                </div>
                <p class="text-blue-600 text-xs mt-2">
                    Enter this code below to confirm your email
                </p>
            </div>
        </div>
        
        <!-- Confirmation Code Input -->
        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Confirmation Code
            </label>
            <input
                v-model="enteredCode"
                type="text"
                placeholder="Enter your 6-character code"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-center text-lg font-bold tracking-widest uppercase"
                maxlength="6"
                @input="enteredCode = $event.target.value.toUpperCase()"
            />
            <p class="text-gray-500 text-xs mt-1">
                Code is case-insensitive and expires in 24 hours
            </p>
        </div>
        
        <!-- Status Messages -->
        <div v-if="codeGenerated" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-start">
                <i class="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                <div>
                    <p class="text-green-700 text-sm font-medium">New code generated!</p>
                    <p class="text-green-600 text-xs mt-1">
                        Use the code shown above to confirm your email.
                    </p>
                </div>
            </div>
        </div>
        
        <div v-if="manualConfirmationSuccess" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-start">
                <i class="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
                <div>
                    <p class="text-green-700 text-sm font-medium">Email confirmed!</p>
                    <p class="text-green-600 text-xs mt-1">
                        You can now sign in to your account.
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="space-y-3">
            <!-- Confirm with Code -->
            <button
                @click="handleConfirmWithCode"
                :disabled="confirmationLoading || !enteredCode || enteredCode.length < 6"
                class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                <i v-if="confirmationLoading" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-key mr-2"></i>
                {{ confirmationLoading ? 'Confirming...' : 'Confirm with Code' }}
            </button>
            
            <!-- Generate New Code -->
            <button
                @click="handleGenerateNewCode"
                :disabled="generateLoading"
                class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                <i v-if="generateLoading" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-refresh mr-2"></i>
                {{ generateLoading ? 'Generating...' : 'Generate New Code' }}
            </button>
            
            <!-- Manual Confirmation (Fallback) -->
            <button
                @click="handleManualConfirmation"
                :disabled="manualLoading"
                class="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                <i v-if="manualLoading" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-unlock mr-2"></i>
                {{ manualLoading ? 'Confirming...' : 'Manual Confirmation (Skip Code)' }}
            </button>
        </div>
        
        <!-- Help Text -->
        <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-start">
                <i class="fas fa-info-circle text-blue-500 mr-2 mt-0.5"></i>
                <div class="text-sm">
                    <p class="text-blue-700 font-medium mb-1">Having trouble?</p>
                    <ul class="text-blue-600 text-xs space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Try the manual confirmation button above</li>
                        <li>• Make sure {{ email }} is correct</li>
                        <li>• Wait a few minutes and try again</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- Back to Login -->
        <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">
                Already confirmed? 
                <button 
                    @click="$emit('back-to-login')" 
                    class="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                >
                    Try signing in
                </button>
            </p>
            <p class="text-gray-500 text-xs mt-2">
                Wrong email? 
                <button 
                    @click="$emit('switch-to-register')" 
                    class="text-gray-600 hover:text-gray-700 hover:underline"
                >
                    Register with different email
                </button>
            </p>
        </div>
    </div>
    `,
    
    props: {
        email: {
            type: String,
            required: true
        },
        initialConfirmationCode: {
            type: String,
            default: null
        }
    },
    
    setup(props, { emit }) {
        const store = window.store;
        
        // Component state
        const confirmationLoading = Vue.ref(false);
        const generateLoading = Vue.ref(false);
        const manualLoading = Vue.ref(false);
        const codeGenerated = Vue.ref(false);
        const manualConfirmationSuccess = Vue.ref(false);
        
        // Form state
        const enteredCode = Vue.ref('');
        const currentConfirmationCode = Vue.ref(props.initialConfirmationCode || '');
        
        const handleConfirmWithCode = async () => {
            if (!props.email || !enteredCode.value) return;
            
            confirmationLoading.value = true;
            try {
                console.log('🔑 Email confirmation with code for:', props.email);
                
                const response = await fetch('/api/auth/confirm-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: props.email,
                        confirmationCode: enteredCode.value.trim()
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    console.log('✅ Code confirmation successful');
                    manualConfirmationSuccess.value = true;
                    store.showNotification('Email confirmed successfully! You can now sign in.', 'success');
                    
                    // Auto redirect to login after 2 seconds
                    setTimeout(() => {
                        emit('email-confirmed');
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Failed to confirm email with code');
                }
                
            } catch (error) {
                console.error('❌ Code confirmation failed:', error);
                store.showNotification(error.message || 'Invalid code. Please check and try again.', 'error');
            } finally {
                confirmationLoading.value = false;
            }
        };

        const handleGenerateNewCode = async () => {
            if (!props.email) return;
            
            generateLoading.value = true;
            try {
                console.log('🔄 Generating new confirmation code for:', props.email);
                
                const response = await fetch('/api/auth/generate-confirmation-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: props.email
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    console.log('✅ New confirmation code generated');
                    currentConfirmationCode.value = data.confirmationCode;
                    codeGenerated.value = true;
                    enteredCode.value = ''; // Clear entered code
                    store.showNotification('New confirmation code generated!', 'success');
                    
                    // Hide success message after 3 seconds
                    setTimeout(() => {
                        codeGenerated.value = false;
                    }, 3000);
                } else {
                    throw new Error(data.message || 'Failed to generate new code');
                }
                
            } catch (error) {
                console.error('❌ Generate code failed:', error);
                store.showNotification(error.message || 'Failed to generate new code. Please try again.', 'error');
            } finally {
                generateLoading.value = false;
            }
        };

        const handleManualConfirmation = async () => {
            if (!props.email) return;
            
            manualLoading.value = true;
            try {
                console.log('🔄 Manual email confirmation for:', props.email);
                
                const response = await fetch('/api/auth/confirm-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: props.email
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    console.log('✅ Manual confirmation successful');
                    manualConfirmationSuccess.value = true;
                    store.showNotification('Email confirmed successfully! You can now sign in.', 'success');
                    
                    // Auto redirect to login after 2 seconds
                    setTimeout(() => {
                        emit('email-confirmed');
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Failed to confirm email');
                }
                
            } catch (error) {
                console.error('❌ Manual confirmation failed:', error);
                store.showNotification(error.message || 'Failed to confirm email. Please try again.', 'error');
            } finally {
                manualLoading.value = false;
            }
        };
        
        // Reset state when email changes
        Vue.watch(() => props.email, () => {
            codeGenerated.value = false;
            manualConfirmationSuccess.value = false;
            enteredCode.value = '';
        });
        
        // Auto-generate code on mount if not provided
        Vue.onMounted(() => {
            if (!currentConfirmationCode.value) {
                handleGenerateNewCode();
            }
        });
        
        return {
            confirmationLoading,
            generateLoading,
            manualLoading,
            codeGenerated,
            manualConfirmationSuccess,
            enteredCode,
            currentConfirmationCode,
            handleConfirmWithCode,
            handleGenerateNewCode,
            handleManualConfirmation
        };
    },
    
    emits: ['back-to-login', 'switch-to-register', 'email-confirmed']
};