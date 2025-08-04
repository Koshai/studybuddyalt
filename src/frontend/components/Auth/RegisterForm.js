// components/Auth/RegisterForm.js - User Registration Component
window.RegisterFormComponent = {
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
                <div>
                    <input
                        v-model="firstName"
                        type="text"
                        placeholder="First name"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors"
                        required
                        :class="{ 'border-red-300': errors.firstName }"
                    />
                    <p v-if="errors.firstName" class="text-red-500 text-xs mt-1">{{ errors.firstName }}</p>
                </div>
                <div>
                    <input
                        v-model="lastName"
                        type="text"
                        placeholder="Last name"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors"
                        required
                        :class="{ 'border-red-300': errors.lastName }"
                    />
                    <p v-if="errors.lastName" class="text-red-500 text-xs mt-1">{{ errors.lastName }}</p>
                </div>
            </div>
            
            <div>
                <input
                    v-model="username"
                    type="text"
                    placeholder="Username (3-20 characters)"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors"
                    required
                    minlength="3"
                    maxlength="20"
                    :class="{ 'border-red-300': errors.username }"
                />
                <p v-if="errors.username" class="text-red-500 text-xs mt-1">{{ errors.username }}</p>
            </div>
            
            <div>
                <input
                    v-model="email"
                    type="email"
                    placeholder="Email address"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors"
                    required
                    :class="{ 'border-red-300': errors.email }"
                />
                <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
            </div>
            
            <div>
                <input
                    v-model="password"
                    type="password"
                    placeholder="Password (min 8 characters)"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors"
                    required
                    minlength="8"
                    :class="{ 'border-red-300': errors.password }"
                />
                <div class="mt-1">
                    <div class="flex space-x-1">
                        <div class="h-1 flex-1 rounded-full" :class="passwordStrengthColor"></div>
                        <div class="h-1 flex-1 rounded-full" :class="passwordStrength >= 2 ? passwordStrengthColor : 'bg-gray-200'"></div>
                        <div class="h-1 flex-1 rounded-full" :class="passwordStrength >= 3 ? passwordStrengthColor : 'bg-gray-200'"></div>
                        <div class="h-1 flex-1 rounded-full" :class="passwordStrength >= 4 ? passwordStrengthColor : 'bg-gray-200'"></div>
                    </div>
                    <p class="text-xs mt-1" :class="passwordStrengthTextColor">{{ passwordStrengthText }}</p>
                </div>
                <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
            </div>
            
            <div>
                <input
                    v-model="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors"
                    required
                    :class="{ 'border-red-300': errors.confirmPassword }"
                />
                <p v-if="errors.confirmPassword" class="text-red-500 text-xs mt-1">{{ errors.confirmPassword }}</p>
            </div>
            
            <!-- Plan Selection -->
            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 class="font-medium text-gray-900 mb-3">Choose Your Plan</h4>
                <div class="space-y-2">
                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input 
                            v-model="selectedPlan" 
                            type="radio" 
                            value="free" 
                            class="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                        />
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-900">Free Plan</span>
                                <span class="text-sm font-bold text-green-600">$0/month</span>
                            </div>
                            <p class="text-xs text-gray-600">50 questions/month, 3 topics, 100MB storage</p>
                        </div>
                    </label>
                    
                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input 
                            v-model="selectedPlan" 
                            type="radio" 
                            value="pro" 
                            class="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                        />
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-gray-900">Pro Plan</span>
                                <span class="text-sm font-bold text-purple-600">$9.99/month</span>
                            </div>
                            <p class="text-xs text-gray-600">1500 questions/month, unlimited topics, 5GB storage</p>
                        </div>
                    </label>
                </div>
            </div>
            
            <!-- Terms and Privacy -->
            <div class="flex items-start space-x-2">
                <input
                    v-model="agreeToTerms"
                    type="checkbox"
                    id="terms"
                    class="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                    required
                />
                <label for="terms" class="text-xs text-gray-600 leading-relaxed">
                    I agree to the 
                    <a href="#" class="text-primary-500 hover:underline">Terms of Service</a> 
                    and 
                    <a href="#" class="text-primary-500 hover:underline">Privacy Policy</a>
                </label>
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
        
        <!-- Success Message -->
        <div v-if="registrationSuccess" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <p class="text-green-700 text-sm">
                    Account created successfully! You can now sign in.
                </p>
            </div>
        </div>
    </div>
    `,
    
    setup(props, { emit }) {
        const store = window.store;
        
        // Form fields
        const firstName = Vue.ref('');
        const lastName = Vue.ref('');
        const username = Vue.ref('');
        const email = Vue.ref('');
        const password = Vue.ref('');
        const confirmPassword = Vue.ref('');
        const selectedPlan = Vue.ref('free');
        const agreeToTerms = Vue.ref(false);
        
        // Form state
        const isLoading = Vue.ref(false);
        const errors = Vue.ref({});
        const registrationSuccess = Vue.ref(false);

        // Password strength calculation
        const passwordStrength = Vue.computed(() => {
            const pwd = password.value;
            let strength = 0;
            
            if (pwd.length >= 8) strength++;
            if (/[a-z]/.test(pwd)) strength++;
            if (/[A-Z]/.test(pwd)) strength++;
            if (/[0-9]/.test(pwd)) strength++;
            if (/[^A-Za-z0-9]/.test(pwd)) strength++;
            
            return Math.min(strength, 4);
        });

        const passwordStrengthColor = Vue.computed(() => {
            const colors = {
                0: 'bg-gray-200',
                1: 'bg-red-400',
                2: 'bg-yellow-400',
                3: 'bg-blue-400',
                4: 'bg-green-400'
            };
            return colors[passwordStrength.value] || 'bg-gray-200';
        });

        const passwordStrengthText = Vue.computed(() => {
            const texts = {
                0: 'Enter a password',
                1: 'Very weak',
                2: 'Weak',
                3: 'Good',
                4: 'Strong'
            };
            return texts[passwordStrength.value] || '';
        });

        const passwordStrengthTextColor = Vue.computed(() => {
            const colors = {
                0: 'text-gray-500',
                1: 'text-red-500',
                2: 'text-yellow-600',
                3: 'text-blue-500',
                4: 'text-green-500'
            };
            return colors[passwordStrength.value] || 'text-gray-500';
        });

        // Form validation
        const isFormValid = Vue.computed(() => {
            return firstName.value.trim() && 
                   lastName.value.trim() && 
                   username.value.trim().length >= 3 && 
                   email.value.trim() && 
                   password.value.length >= 8 && 
                   confirmPassword.value === password.value &&
                   agreeToTerms.value &&
                   Object.keys(errors.value).length === 0;
        });

        // Real-time validation
        Vue.watch([firstName, lastName, username, email, password, confirmPassword], () => {
            validateForm();
        });

        const validateForm = () => {
            const newErrors = {};
            
            // First name validation
            if (firstName.value.trim() && firstName.value.trim().length < 2) {
                newErrors.firstName = 'First name must be at least 2 characters';
            }
            
            // Last name validation
            if (lastName.value.trim() && lastName.value.trim().length < 2) {
                newErrors.lastName = 'Last name must be at least 2 characters';
            }
            
            // Username validation
            if (username.value.trim()) {
                if (username.value.trim().length < 3) {
                    newErrors.username = 'Username must be at least 3 characters';
                } else if (username.value.trim().length > 20) {
                    newErrors.username = 'Username must be less than 20 characters';
                } else if (!/^[a-zA-Z0-9_]+$/.test(username.value.trim())) {
                    newErrors.username = 'Username can only contain letters, numbers, and underscores';
                }
            }
            
            // Email validation
            if (email.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.value.trim())) {
                    newErrors.email = 'Please enter a valid email address';
                }
            }
            
            // Password validation
            if (password.value && password.value.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }
            
            // Confirm password validation
            if (confirmPassword.value && confirmPassword.value !== password.value) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
            
            errors.value = newErrors;
        };

        const handleRegister = async () => {
            if (!isFormValid.value) {
                validateForm();
                return;
            }
            
            isLoading.value = true;
            errors.value = {};
            
            try {
                const userData = {
                    firstName: firstName.value.trim(),
                    lastName: lastName.value.trim(),
                    username: username.value.trim(),
                    email: email.value.trim(),
                    password: password.value,
                    subscriptionTier: selectedPlan.value
                };
                
                const result = await store.register(userData);
                
                // Check if user needs email confirmation
                if (result && result.needsEmailConfirmation && result.confirmationCode) {
                    console.log('📧 User needs email confirmation');
                    emit('register-success', {
                        needsConfirmation: true,
                        email: userData.email,
                        confirmationCode: result.confirmationCode
                    });
                } else {
                    // Show success message for direct login
                    registrationSuccess.value = true;
                    
                    // Auto-switch to login after 2 seconds
                    setTimeout(() => {
                        emit('register-success');
                        emit('switch-to-login');
                    }, 2000);
                }
                
            } catch (error) {
                console.error('Registration failed:', error);
                
                // Handle specific server errors
                if (error.message.includes('email already exists')) {
                    errors.value.email = 'This email is already registered';
                } else if (error.message.includes('username already exists')) {
                    errors.value.username = 'This username is already taken';
                } else {
                    // Generic error handling is done in the store
                }
            } finally {
                isLoading.value = false;
            }
        };

        const resetForm = () => {
            firstName.value = '';
            lastName.value = '';
            username.value = '';
            email.value = '';
            password.value = '';
            confirmPassword.value = '';
            selectedPlan.value = 'free';
            agreeToTerms.value = false;
            errors.value = {};
            registrationSuccess.value = false;
        };

        // Reset form when component unmounts
        Vue.onUnmounted(() => {
            resetForm();
        });

        return {
            firstName,
            lastName,
            username,
            email,
            password,
            confirmPassword,
            selectedPlan,
            agreeToTerms,
            isLoading,
            errors,
            registrationSuccess,
            isFormValid,
            passwordStrength,
            passwordStrengthColor,
            passwordStrengthText,
            passwordStrengthTextColor,
            handleRegister,
            validateForm,
            resetForm
        };
    },
    
    emits: ['switch-to-login', 'register-success']
};