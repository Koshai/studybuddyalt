// src/frontend/components/Setup/OfflineSetup.js - Offline Mode Setup Component
window.OfflineSetupComponent = {
    template: `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" v-if="show">
            <div class="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-screen overflow-y-auto animate-scale-in">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-download text-white text-3xl"></i>
                    </div>
                    <div class="flex items-center justify-center gap-3 mb-2">
                        <h2 class="text-2xl font-bold text-gray-900">Enable Offline Mode</h2>
                        <span class="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">ALPHA</span>
                    </div>
                    <p class="text-gray-600 mb-3">Set up local AI processing for privacy and offline access</p>
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-orange-600 mr-2 mt-0.5"></i>
                            <div class="text-sm text-orange-700">
                                <strong>Alpha Feature:</strong> This is experimental functionality. Please report any issues you encounter during testing.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Setup Steps -->
                <div class="space-y-6">
                    <!-- Step 1: Benefits -->
                    <div v-if="currentStep === 'benefits'" class="space-y-6">
                        <div class="text-center">
                            <h3 class="text-xl font-semibold text-gray-900 mb-4">Why Go Offline?</h3>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-shield-alt text-green-600 mr-2"></i>
                                    <h4 class="font-semibold text-green-900">Complete Privacy</h4>
                                </div>
                                <p class="text-sm text-green-700">Your study materials never leave your computer</p>
                            </div>
                            
                            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-wifi-slash text-blue-600 mr-2"></i>
                                    <h4 class="font-semibold text-blue-900">Work Offline</h4>
                                </div>
                                <p class="text-sm text-blue-700">Generate questions without internet connection</p>
                            </div>
                            
                            <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-bolt text-purple-600 mr-2"></i>
                                    <h4 class="font-semibold text-purple-900">Faster Processing</h4>
                                </div>
                                <p class="text-sm text-purple-700">No API delays, instant responses</p>
                            </div>
                            
                            <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-coins text-orange-600 mr-2"></i>
                                    <h4 class="font-semibold text-orange-900">No API Costs</h4>
                                </div>
                                <p class="text-sm text-orange-700">Unlimited questions without fees</p>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button @click="$emit('close')" class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Maybe Later
                            </button>
                            <button @click="currentStep = 'requirements'" class="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg">
                                <i class="fas fa-arrow-right mr-2"></i>
                                Let's Set It Up
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: System Requirements -->
                    <div v-if="currentStep === 'requirements'" class="space-y-6">
                        <div class="text-center">
                            <h3 class="text-xl font-semibold text-gray-900 mb-4">System Check</h3>
                            <p class="text-gray-600">Checking if your system is ready for offline mode</p>
                        </div>
                        
                        <div class="space-y-3">
                            <div class="flex items-center p-3 border rounded-lg" :class="systemCheck.os ? 'border-green-200 bg-green-50' : 'border-gray-200'">
                                <i :class="systemCheck.os ? 'fas fa-check text-green-600' : 'fas fa-clock text-gray-400'" class="mr-3"></i>
                                <span class="flex-1">Operating System: {{ systemInfo.os }}</span>
                                <span v-if="systemCheck.os" class="text-green-600 text-sm">✓ Compatible</span>
                            </div>
                            
                            <div class="flex items-center p-3 border rounded-lg" :class="systemCheck.storage ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'">
                                <i :class="systemCheck.storage ? 'fas fa-check text-green-600' : 'fas fa-exclamation-triangle text-yellow-600'" class="mr-3"></i>
                                <span class="flex-1">Available Storage: {{ systemInfo.storageGB }}GB</span>
                                <span v-if="systemCheck.storage" class="text-green-600 text-sm">✓ Sufficient</span>
                                <span v-else class="text-yellow-600 text-sm">⚠ May be tight</span>
                            </div>
                            
                            <div class="flex items-center p-3 border rounded-lg" :class="systemCheck.memory ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'">
                                <i :class="systemCheck.memory ? 'fas fa-check text-green-600' : 'fas fa-exclamation-triangle text-yellow-600'" class="mr-3"></i>
                                <span class="flex-1">System Memory: {{ systemInfo.memoryGB }}GB</span>
                                <span v-if="systemCheck.memory" class="text-green-600 text-sm">✓ Good</span>
                                <span v-else class="text-yellow-600 text-sm">⚠ Limited</span>
                            </div>
                        </div>
                        
                        <div v-if="systemCheck.canInstall" class="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div class="flex items-center">
                                <i class="fas fa-thumbs-up text-green-600 mr-2"></i>
                                <span class="font-medium text-green-900">Your system is ready for offline mode!</span>
                            </div>
                        </div>
                        
                        <div v-else class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
                                <span class="font-medium text-yellow-900">System meets minimum requirements</span>
                            </div>
                            <p class="text-sm text-yellow-700">Offline mode will work but may be slower on this system.</p>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button @click="currentStep = 'benefits'" class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                <i class="fas fa-arrow-left mr-2"></i>
                                Back
                            </button>
                            <button @click="currentStep = 'installation'" class="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg">
                                <i class="fas fa-download mr-2"></i>
                                Start Installation
                            </button>
                        </div>
                    </div>

                    <!-- Step 3: Installation -->
                    <div v-if="currentStep === 'installation'" class="space-y-6">
                        <div class="text-center">
                            <h3 class="text-xl font-semibold text-gray-900 mb-4">Installing Offline AI</h3>
                            <p class="text-gray-600">This will take a few minutes...</p>
                        </div>
                        
                        <!-- Installation Progress -->
                        <div class="space-y-4">
                            <div v-for="step in installationSteps" :key="step.id" 
                                 class="flex items-center p-4 border rounded-lg"
                                 :class="getStepClass(step)">
                                <div class="flex-shrink-0 mr-4">
                                    <i v-if="step.status === 'completed'" class="fas fa-check text-green-600"></i>
                                    <i v-else-if="step.status === 'in-progress'" class="fas fa-spinner fa-spin text-blue-600"></i>
                                    <i v-else-if="step.status === 'error'" class="fas fa-times text-red-600"></i>
                                    <i v-else class="fas fa-clock text-gray-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">{{ step.title }}</div>
                                    <div class="text-sm text-gray-600">{{ step.description }}</div>
                                    <div v-if="step.progress" class="mt-2">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                                 :style="{ width: step.progress + '%' }"></div>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">{{ step.progress }}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Error Handling -->
                        <div v-if="installationError" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-exclamation-circle text-red-600 mr-2"></i>
                                <span class="font-medium text-red-900">Installation Error</span>
                            </div>
                            <p class="text-sm text-red-700 mb-3">{{ installationError }}</p>
                            <button @click="retryInstallation" class="text-red-600 hover:text-red-700 text-sm font-medium">
                                <i class="fas fa-redo mr-1"></i>
                                Try Again
                            </button>
                        </div>
                        
                        <!-- Success -->
                        <div v-if="installationComplete" class="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                <span class="font-medium text-green-900">Offline mode is ready!</span>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button @click="$emit('close')" :disabled="isInstalling" 
                                    class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                {{ installationComplete ? 'Close' : 'Cancel' }}
                            </button>
                            <button v-if="installationComplete" @click="testOfflineMode" 
                                    class="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg">
                                <i class="fas fa-play mr-2"></i>
                                Test Offline Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    props: {
        show: {
            type: Boolean,
            default: false
        }
    },

    setup(props, { emit }) {
        const currentStep = Vue.ref('benefits');
        const isInstalling = Vue.ref(false);
        const installationError = Vue.ref('');
        const installationComplete = Vue.ref(false);

        // System information
        const systemInfo = Vue.ref({
            os: 'Checking...',
            storageGB: 0,
            memoryGB: 0
        });

        // System compatibility check
        const systemCheck = Vue.computed(() => ({
            os: true, // Always true for web app
            storage: systemInfo.value.storageGB >= 20,
            memory: systemInfo.value.memoryGB >= 8,
            canInstall: systemInfo.value.storageGB >= 10 && systemInfo.value.memoryGB >= 4
        }));

        // Installation steps
        const installationSteps = Vue.ref([
            {
                id: 1,
                title: 'Downloading Ollama',
                description: 'Getting the latest offline AI engine',
                status: 'pending',
                progress: 0
            },
            {
                id: 2,
                title: 'Installing AI Engine',
                description: 'Setting up local AI processing',
                status: 'pending',
                progress: 0
            },
            {
                id: 3,
                title: 'Setting Up Local Storage',
                description: 'Creating your personal data directory',
                status: 'pending',
                progress: 0
            },
            {
                id: 4,
                title: 'Downloading AI Model',
                description: 'Getting optimized model for question generation',
                status: 'pending',
                progress: 0
            },
            {
                id: 5,
                title: 'Testing Installation',
                description: 'Verifying everything works correctly',
                status: 'pending',
                progress: 0
            }
        ]);

        const getStepClass = (step) => {
            switch (step.status) {
                case 'completed':
                    return 'border-green-200 bg-green-50';
                case 'in-progress':
                    return 'border-blue-200 bg-blue-50';
                case 'error':
                    return 'border-red-200 bg-red-50';
                default:
                    return 'border-gray-200 bg-gray-50';
            }
        };

        const startInstallation = async () => {
            isInstalling.value = true;
            installationError.value = '';
            installationComplete.value = false;
            
            try {
                // Check system requirements first
                const requirementsResponse = await fetch('/api/setup/offline/requirements');
                const requirements = await requirementsResponse.json();
                
                if (!requirements.canInstall) {
                    throw new Error('System does not meet minimum requirements for offline mode');
                }

                // Start the installation process using Server-Sent Events
                const eventSource = new EventSource('/api/setup/offline/install');
                
                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Installation progress:', data);
                        
                        // Update step status based on progress
                        const stepMapping = {
                            'downloading': 0,
                            'installing': 1,
                            'initializing_local_system': 2,
                            'downloading_model': 3,
                            'completed': 4
                        };
                        
                        const stepIndex = stepMapping[data.step];
                        if (stepIndex !== undefined) {
                            // Mark previous steps as completed
                            for (let i = 0; i < stepIndex; i++) {
                                installationSteps.value[i].status = 'completed';
                                installationSteps.value[i].progress = 100;
                            }
                            
                            // Update current step
                            const currentStep = installationSteps.value[stepIndex];
                            if (data.step === 'completed') {
                                currentStep.status = 'completed';
                                currentStep.progress = 100;
                                installationComplete.value = true;
                                eventSource.close();
                            } else {
                                currentStep.status = 'in-progress';
                                currentStep.progress = data.progress || 0;
                            }
                        }
                        
                        if (data.error) {
                            throw new Error(data.error);
                        }
                    } catch (parseError) {
                        console.error('Failed to parse installation progress:', parseError);
                    }
                };
                
                eventSource.onerror = (error) => {
                    console.error('Installation stream error:', error);
                    eventSource.close();
                    installationError.value = 'Installation failed. Please try again.';
                    isInstalling.value = false;
                };
                
                // Set a timeout for the installation process
                setTimeout(() => {
                    if (isInstalling.value && !installationComplete.value) {
                        eventSource.close();
                        installationError.value = 'Installation timed out. Please check your internet connection and try again.';
                        isInstalling.value = false;
                    }
                }, 10 * 60 * 1000); // 10 minutes timeout
                
            } catch (error) {
                console.error('Installation failed:', error);
                installationError.value = error.message || 'Installation failed. Please try again.';
                isInstalling.value = false;
            }
        };

        const retryInstallation = () => {
            installationSteps.value.forEach(step => {
                step.status = 'pending';
                step.progress = 0;
            });
            installationError.value = '';
            startInstallation();
        };

        const testOfflineMode = () => {
            emit('offline-ready');
            emit('close');
        };

        // Load system requirements
        const loadSystemRequirements = async () => {
            try {
                const response = await fetch('/api/setup/offline/requirements');
                const data = await response.json();
                
                if (data.systemInfo) {
                    systemInfo.value = {
                        os: `${data.systemInfo.platform} (${data.systemInfo.arch})`,
                        storageGB: data.systemInfo.availableStorageGB,
                        memoryGB: data.systemInfo.totalMemoryGB
                    };
                }
            } catch (error) {
                console.error('Failed to load system requirements:', error);
                systemInfo.value = {
                    os: 'Unknown',
                    storageGB: 0,
                    memoryGB: 0
                };
            }
        };

        // Load system requirements when moving to requirements step
        Vue.watch(currentStep, async (newStep) => {
            if (newStep === 'requirements') {
                await loadSystemRequirements();
            } else if (newStep === 'installation' && !isInstalling.value && !installationComplete.value) {
                startInstallation();
            }
        });

        return {
            currentStep,
            systemInfo,
            systemCheck,
            installationSteps,
            isInstalling,
            installationError,
            installationComplete,
            getStepClass,
            retryInstallation,
            testOfflineMode
        };
    },

    emits: ['close', 'offline-ready']
};

console.log('✅ OfflineSetup component loaded successfully!');