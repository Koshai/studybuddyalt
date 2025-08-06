// components/Settings/UserSettings.js - Comprehensive User Settings Component
window.UserSettingsComponent = {
    template: `
    <div class="animate-fade-in max-w-4xl mx-auto p-6 space-y-8">
        <!-- Settings Header -->
        <div class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl text-white p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold mb-2">Account Settings</h1>
                    <p class="text-white/90">Manage your profile, preferences, and account settings</p>
                </div>
                <div class="text-right">
                    <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p class="text-sm text-white/80">Account Type</p>
                        <p class="font-bold">{{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Navigation Tabs -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="border-b border-gray-200">
                <div class="flex space-x-0">
                    <button
                        v-for="tab in tabs"
                        :key="tab.id"
                        @click="activeTab = tab.id"
                        :class="[
                            'flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors',
                            activeTab === tab.id
                                ? 'border-primary-500 text-primary-600 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        ]"
                    >
                        <i :class="tab.icon" class="mr-2"></i>
                        {{ tab.name }}
                    </button>
                </div>
            </div>

            <!-- Settings Content -->
            <div class="p-6">
                <!-- Profile Settings -->
                <div v-if="activeTab === 'profile'" class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                        
                        <!-- Profile Picture -->
                        <div class="flex items-center space-x-6 mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                <span class="text-white font-bold text-2xl">{{ getUserInitials }}</span>
                            </div>
                            <div>
                                <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Change Avatar
                                </button>
                                <p class="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                            </div>
                        </div>

                        <!-- Profile Form -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ValidatedInput
                                v-model="profileForm.firstName"
                                label="First Name"
                                type="text"
                                :required="true"
                                :hasError="profileErrors.firstName"
                                :errorMessage="profileErrors.firstName"
                            />
                            
                            <ValidatedInput
                                v-model="profileForm.lastName"
                                label="Last Name"
                                type="text"
                                :required="true"
                                :hasError="profileErrors.lastName"
                                :errorMessage="profileErrors.lastName"
                            />
                            
                            <ValidatedInput
                                v-model="profileForm.email"
                                label="Email Address"
                                type="email"
                                :required="true"
                                :hasError="profileErrors.email"
                                :errorMessage="profileErrors.email"
                                class="md:col-span-2"
                            />
                        </div>

                        <!-- Save Profile Button -->
                        <div class="flex justify-end mt-6">
                            <button
                                @click="saveProfile"
                                :disabled="profileSaving"
                                class="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                <i v-if="profileSaving" class="fas fa-spinner fa-spin mr-2"></i>
                                {{ profileSaving ? 'Saving...' : 'Save Changes' }}
                            </button>
                        </div>
                    </div>

                    <!-- Change Password Section -->
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                        
                        <div class="max-w-md space-y-4">
                            <ValidatedInput
                                v-model="passwordForm.current"
                                label="Current Password"
                                type="password"
                                :required="true"
                                :hasError="passwordErrors.current"
                                :errorMessage="passwordErrors.current"
                            />
                            
                            <ValidatedInput
                                v-model="passwordForm.new"
                                label="New Password"
                                type="password"
                                :required="true"
                                :hasError="passwordErrors.new"
                                :errorMessage="passwordErrors.new"
                            />
                            
                            <ValidatedInput
                                v-model="passwordForm.confirm"
                                label="Confirm New Password"
                                type="password"
                                :required="true"
                                :hasError="passwordErrors.confirm"
                                :errorMessage="passwordErrors.confirm"
                            />
                        </div>

                        <div class="flex justify-end mt-6">
                            <button
                                @click="changePassword"
                                :disabled="passwordSaving"
                                class="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                <i v-if="passwordSaving" class="fas fa-spinner fa-spin mr-2"></i>
                                {{ passwordSaving ? 'Changing...' : 'Change Password' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Notifications Settings -->
                <div v-if="activeTab === 'notifications'" class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                    
                    <div class="space-y-4">
                        <!-- Email Notifications -->
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-900">Email Notifications</h4>
                                <p class="text-sm text-gray-600">Receive email updates about your account and activities</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    v-model="notificationSettings.email"
                                    class="sr-only peer"
                                >
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        <!-- Study Reminders -->
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-900">Study Reminders</h4>
                                <p class="text-sm text-gray-600">Get reminded to practice and review your materials</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    v-model="notificationSettings.studyReminders"
                                    class="sr-only peer"
                                >
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        <!-- Usage Alerts -->
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-900">Usage Alerts</h4>
                                <p class="text-sm text-gray-600">Notifications when approaching limits or quotas</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    v-model="notificationSettings.usageAlerts"
                                    class="sr-only peer"
                                >
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        <!-- Marketing Emails -->
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-900">Marketing & Updates</h4>
                                <p class="text-sm text-gray-600">Product updates, tips, and promotional content</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    v-model="notificationSettings.marketing"
                                    class="sr-only peer"
                                >
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>

                    <!-- Save Notifications Button -->
                    <div class="flex justify-end mt-6">
                        <button
                            @click="saveNotificationSettings"
                            :disabled="notificationsSaving"
                            class="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            <i v-if="notificationsSaving" class="fas fa-spinner fa-spin mr-2"></i>
                            {{ notificationsSaving ? 'Saving...' : 'Save Preferences' }}
                        </button>
                    </div>
                </div>

                <!-- Study Preferences -->
                <div v-if="activeTab === 'study'" class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900">Study Preferences</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Default Difficulty -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Default Question Difficulty</label>
                            <select
                                v-model="studyPreferences.defaultDifficulty"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="mixed">Mixed</option>
                            </select>
                        </div>

                        <!-- Question Types -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Preferred Question Types</label>
                            <select
                                v-model="studyPreferences.questionTypes"
                                multiple
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                style="height: 100px;"
                            >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="true_false">True/False</option>
                                <option value="short_answer">Short Answer</option>
                                <option value="essay">Essay</option>
                            </select>
                        </div>

                        <!-- Practice Session Length -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Default Session Length</label>
                            <select
                                v-model="studyPreferences.sessionLength"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="5">5 Questions</option>
                                <option value="10">10 Questions</option>
                                <option value="15">15 Questions</option>
                                <option value="20">20 Questions</option>
                                <option value="25">25 Questions</option>
                            </select>
                        </div>

                        <!-- AI Service Preference -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Preferred AI Service</label>
                            <select
                                v-model="studyPreferences.aiService"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="auto">Auto-detect (Recommended)</option>
                                <option value="openai">OpenAI (Online)</option>
                                <option value="ollama">Ollama (Offline)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Study Goals -->
                    <div>
                        <h4 class="text-md font-medium text-gray-900 mb-3">Study Goals</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Daily Questions Goal</label>
                                <input
                                    v-model.number="studyPreferences.dailyGoal"
                                    type="number"
                                    min="1"
                                    max="100"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Weekly Sessions Goal</label>
                                <input
                                    v-model.number="studyPreferences.weeklyGoal"
                                    type="number"
                                    min="1"
                                    max="50"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Target Accuracy (%)</label>
                                <input
                                    v-model.number="studyPreferences.targetAccuracy"
                                    type="number"
                                    min="50"
                                    max="100"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Save Study Preferences Button -->
                    <div class="flex justify-end mt-6">
                        <button
                            @click="saveStudyPreferences"
                            :disabled="studyPrefSaving"
                            class="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            <i v-if="studyPrefSaving" class="fas fa-spinner fa-spin mr-2"></i>
                            {{ studyPrefSaving ? 'Saving...' : 'Save Preferences' }}
                        </button>
                    </div>
                </div>

                <!-- Data & Privacy -->
                <div v-if="activeTab === 'data'" class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900">Data & Privacy</h3>
                    
                    <!-- Export Data -->
                    <div class="border border-gray-200 rounded-lg p-6">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">Export Your Data</h4>
                                <p class="text-sm text-gray-600 mt-1">Download all your study materials, questions, and progress data</p>
                            </div>
                            <button
                                @click="exportUserData"
                                :disabled="exportInProgress"
                                class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <i v-if="exportInProgress" class="fas fa-spinner fa-spin mr-2"></i>
                                <i v-else class="fas fa-download mr-2"></i>
                                {{ exportInProgress ? 'Exporting...' : 'Export Data' }}
                            </button>
                        </div>
                    </div>

                    <!-- Import Data -->
                    <div class="border border-gray-200 rounded-lg p-6">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">Import Data</h4>
                                <p class="text-sm text-gray-600 mt-1">Restore data from a previous export file</p>
                            </div>
                            <div class="space-x-3">
                                <input
                                    ref="importFileInput"
                                    type="file"
                                    accept=".json"
                                    @change="handleImportFile"
                                    class="hidden"
                                >
                                <button
                                    @click="$refs.importFileInput.click()"
                                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <i class="fas fa-upload mr-2"></i>
                                    Select File
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Account Deletion -->
                    <div class="border border-red-200 rounded-lg p-6 bg-red-50">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-medium text-red-900">Delete Account</h4>
                                <p class="text-sm text-red-700 mt-1">Permanently delete your account and all associated data</p>
                                <p class="text-xs text-red-600 mt-2"><strong>Warning:</strong> This action cannot be undone</p>
                            </div>
                            <button
                                @click="showDeleteConfirmation = true"
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <i class="fas fa-trash mr-2"></i>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Account Confirmation Modal -->
        <ConfirmationModal
            v-if="showDeleteConfirmation"
            :show="showDeleteConfirmation"
            title="Delete Account"
            message="Are you sure you want to permanently delete your account? This will remove all your study materials, questions, and progress. This action cannot be undone."
            confirmText="Delete Account"
            cancelText="Cancel"
            type="danger"
            @confirm="deleteAccount"
            @cancel="showDeleteConfirmation = false"
        />
    </div>
    `,

    setup() {
        const store = window.store;
        
        // Tab management
        const activeTab = Vue.ref('profile');
        const tabs = [
            { id: 'profile', name: 'Profile', icon: 'fas fa-user' },
            { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
            { id: 'study', name: 'Study Preferences', icon: 'fas fa-brain' },
            { id: 'data', name: 'Data & Privacy', icon: 'fas fa-shield-alt' }
        ];

        // Form states
        const profileForm = Vue.reactive({
            firstName: '',
            lastName: '',
            email: ''
        });
        
        const passwordForm = Vue.reactive({
            current: '',
            new: '',
            confirm: ''
        });
        
        const notificationSettings = Vue.reactive({
            email: true,
            studyReminders: true,
            usageAlerts: true,
            marketing: false
        });
        
        const studyPreferences = Vue.reactive({
            defaultDifficulty: 'medium',
            questionTypes: ['multiple_choice'],
            sessionLength: 10,
            aiService: 'auto',
            dailyGoal: 10,
            weeklyGoal: 5,
            targetAccuracy: 80
        });

        // Loading states
        const profileSaving = Vue.ref(false);
        const passwordSaving = Vue.ref(false);
        const notificationsSaving = Vue.ref(false);
        const studyPrefSaving = Vue.ref(false);
        const exportInProgress = Vue.ref(false);
        const showDeleteConfirmation = Vue.ref(false);

        // Error states
        const profileErrors = Vue.reactive({
            firstName: null,
            lastName: null,
            email: null
        });
        
        const passwordErrors = Vue.reactive({
            current: null,
            new: null,
            confirm: null
        });

        // Computed
        const getUserInitials = Vue.computed(() => {
            const user = store.state.user;
            if (!user) return 'U';
            const first = user.firstName?.[0]?.toUpperCase() || '';
            const last = user.lastName?.[0]?.toUpperCase() || '';
            return first + last || 'U';
        });

        // Initialize form data
        const initializeFormData = () => {
            const user = store.state.user;
            if (user) {
                profileForm.firstName = user.firstName || '';
                profileForm.lastName = user.lastName || '';
                profileForm.email = user.email || '';
            }
        };

        // Load user settings
        const loadUserSettings = async () => {
            try {
                const response = await fetch('/api/auth/settings', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.settings) {
                        Object.assign(notificationSettings, data.settings.notifications || {});
                        Object.assign(studyPreferences, data.settings.study || {});
                    }
                }
            } catch (error) {
                console.error('Failed to load user settings:', error);
            }
        };

        // Profile management
        const validateProfile = () => {
            let isValid = true;
            
            // Reset errors
            Object.keys(profileErrors).forEach(key => profileErrors[key] = null);
            
            if (!profileForm.firstName.trim()) {
                profileErrors.firstName = 'First name is required';
                isValid = false;
            }
            
            if (!profileForm.lastName.trim()) {
                profileErrors.lastName = 'Last name is required';
                isValid = false;
            }
            
            if (!profileForm.email.trim()) {
                profileErrors.email = 'Email is required';
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
                profileErrors.email = 'Please enter a valid email address';
                isValid = false;
            }
            
            return isValid;
        };

        const saveProfile = async () => {
            if (!validateProfile()) return;
            
            profileSaving.value = true;
            
            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify(profileForm)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    store.updateUser(data.user);
                    store.showNotification('Profile updated successfully!', 'success');
                } else {
                    throw new Error(data.message || 'Failed to update profile');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            } finally {
                profileSaving.value = false;
            }
        };

        const validatePassword = () => {
            let isValid = true;
            
            // Reset errors
            Object.keys(passwordErrors).forEach(key => passwordErrors[key] = null);
            
            if (!passwordForm.current.trim()) {
                passwordErrors.current = 'Current password is required';
                isValid = false;
            }
            
            if (!passwordForm.new.trim()) {
                passwordErrors.new = 'New password is required';
                isValid = false;
            } else if (passwordForm.new.length < 6) {
                passwordErrors.new = 'Password must be at least 6 characters';
                isValid = false;
            }
            
            if (passwordForm.new !== passwordForm.confirm) {
                passwordErrors.confirm = 'Passwords do not match';
                isValid = false;
            }
            
            return isValid;
        };

        const changePassword = async () => {
            if (!validatePassword()) return;
            
            passwordSaving.value = true;
            
            try {
                const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        currentPassword: passwordForm.current,
                        newPassword: passwordForm.new
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Clear form
                    passwordForm.current = '';
                    passwordForm.new = '';
                    passwordForm.confirm = '';
                    store.showNotification('Password changed successfully!', 'success');
                } else {
                    throw new Error(data.message || 'Failed to change password');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            } finally {
                passwordSaving.value = false;
            }
        };

        // Settings management
        const saveNotificationSettings = async () => {
            notificationsSaving.value = true;
            
            try {
                const response = await fetch('/api/auth/settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        notifications: notificationSettings
                    })
                });
                
                if (response.ok) {
                    store.showNotification('Notification preferences saved!', 'success');
                } else {
                    throw new Error('Failed to save notification settings');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            } finally {
                notificationsSaving.value = false;
            }
        };

        const saveStudyPreferences = async () => {
            studyPrefSaving.value = true;
            
            try {
                const response = await fetch('/api/auth/settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        study: studyPreferences
                    })
                });
                
                if (response.ok) {
                    store.showNotification('Study preferences saved!', 'success');
                } else {
                    throw new Error('Failed to save study preferences');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            } finally {
                studyPrefSaving.value = false;
            }
        };

        // Data management
        const exportUserData = async () => {
            exportInProgress.value = true;
            
            try {
                const response = await fetch('/api/auth/export-data', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `studybuddy-export-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    store.showNotification('Data exported successfully!', 'success');
                } else {
                    throw new Error('Failed to export data');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            } finally {
                exportInProgress.value = false;
            }
        };

        const handleImportFile = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                const formData = new FormData();
                formData.append('importData', JSON.stringify(data));
                
                const response = await fetch('/api/auth/import-data', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: formData
                });
                
                if (response.ok) {
                    store.showNotification('Data imported successfully!', 'success');
                    // Refresh page data
                    await store.loadUserProfile();
                } else {
                    throw new Error('Failed to import data');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            }
            
            // Clear file input
            event.target.value = '';
        };

        const deleteAccount = async () => {
            try {
                const response = await fetch('/api/auth/delete-account', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                if (response.ok) {
                    store.logout();
                    store.showNotification('Account deleted successfully', 'success');
                } else {
                    throw new Error('Failed to delete account');
                }
            } catch (error) {
                store.showNotification(error.message, 'error');
            }
            
            showDeleteConfirmation.value = false;
        };

        // Initialize on mount
        Vue.onMounted(() => {
            initializeFormData();
            loadUserSettings();
        });

        return {
            store,
            activeTab,
            tabs,
            profileForm,
            passwordForm,
            notificationSettings,
            studyPreferences,
            profileSaving,
            passwordSaving,
            notificationsSaving,
            studyPrefSaving,
            exportInProgress,
            showDeleteConfirmation,
            profileErrors,
            passwordErrors,
            getUserInitials,
            saveProfile,
            changePassword,
            saveNotificationSettings,
            saveStudyPreferences,
            exportUserData,
            handleImportFile,
            deleteAccount
        };
    }
};