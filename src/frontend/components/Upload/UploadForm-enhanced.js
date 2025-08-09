// components/Upload/UploadForm-enhanced.js - Upload with Usage Integration
window.EnhancedUploadFormComponent = {
    template: `
    <div class="animate-fade-in space-y-6 dashboard-content">
        <!-- Header Section with Usage Info -->
        <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-900 flex items-center">
                    <i class="fas fa-upload mr-3 text-primary-500"></i>
                    Upload Study Materials
                </h2>
                <div class="text-right">
                    <div class="bg-white border border-gray-200 rounded-lg px-4 py-2">
                        <p class="text-xs text-gray-600">Storage Used</p>
                        <p class="font-bold text-sm" :class="storageUsagePercentage > 80 ? 'text-red-600' : 'text-gray-900'">
                            {{ storageUsedMB }}MB / {{ storageUsageLimitMB }}MB
                        </p>
                        <div class="w-20 h-1 bg-gray-200 rounded-full mt-1">
                            <div class="h-1 rounded-full transition-all duration-300" 
                                 :class="storageUsagePercentage > 90 ? 'bg-red-500' : storageUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'"
                                 :style="{ width: Math.min(storageUsagePercentage, 100) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
            <p class="text-gray-600">Upload your study materials to generate AI-powered practice questions. Supports images, PDFs, and documents.</p>
            
            <!-- Storage Warning -->
            <div v-if="storageUsagePercentage > 80" class="mt-4 p-3 rounded-lg" :class="storageUsagePercentage > 90 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'">
                <div class="flex items-center">
                    <i :class="['mr-2', storageUsagePercentage > 90 ? 'fas fa-exclamation-circle text-red-500' : 'fas fa-exclamation-triangle text-yellow-500']"></i>
                    <p :class="['text-sm font-medium', storageUsagePercentage > 90 ? 'text-red-800' : 'text-yellow-800']">
                        {{ storageUsagePercentage > 90 ? 'Storage almost full!' : 'Storage running low!' }}
                        {{ storageUsagePercentage.toFixed(1) }}% used.
                        <button v-if="store.state.subscriptionTier === 'free'" 
                                @click="showUpgradeModal" 
                                :class="['ml-2 underline hover:no-underline', storageUsagePercentage > 90 ? 'text-red-900' : 'text-yellow-900']">
                            Upgrade to Pro for 5GB storage
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <div class="max-w-2xl mx-auto">
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Header with Subscription Info -->
                <div class="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-center flex-1">
                            <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-cloud-upload text-white text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">Upload Study Materials</h3>
                            <p class="text-gray-600">AI will extract text and generate questions automatically</p>
                        </div>
                        
                        <!-- Subscription Badge -->
                        <div class="absolute top-4 right-4">
                            <span :class="[
                                'px-2 py-1 rounded-full text-xs font-medium',
                                store.state.subscriptionTier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                            ]">
                                {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Usage Statistics -->
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div class="text-center p-3 bg-white rounded-lg border border-gray-200">
                            <p class="text-xs text-gray-600 mb-1">Files Uploaded</p>
                            <p class="text-lg font-bold text-gray-900">{{ store.state.statistics?.totalNotes || 0 }}</p>
                        </div>
                        <div class="text-center p-3 bg-white rounded-lg border border-gray-200">
                            <p class="text-xs text-gray-600 mb-1">Storage Available</p>
                            <p class="text-lg font-bold" :class="storageUsagePercentage > 80 ? 'text-red-600' : 'text-gray-900'">
                                {{ Math.max(0, storageUsageLimitMB - storageUsedMB) }}MB
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Upload Form -->
                <form @submit.prevent="handleUpload" class="p-6 space-y-6">
                    <!-- Subject Selection -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-book mr-2 text-gray-500"></i>Subject
                        </label>
                        <select
                            v-model="selectedSubject"
                            @change="handleSubjectChange"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            required
                        >
                            <option value="">Choose a subject...</option>
                            <option v-for="subject in subjects" :key="subject.id" :value="subject">
                                {{ subject.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Topic Selection/Creation -->
                    <div v-if="selectedSubject">
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">
                                <i class="fas fa-file-alt mr-2 text-gray-500"></i>Topic
                            </label>
                            <div v-if="store.state.usage?.topics" class="text-xs text-gray-500">
                                {{ store.state.usage.topics.used }}/{{ store.state.usage.topics.limit }} topics used
                            </div>
                        </div>
                        <div class="flex space-x-3">
                            <select
                                v-model="selectedTopic"
                                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                required
                            >
                                <option value="">Choose a topic...</option>
                                <option v-for="topic in availableTopics" :key="topic.id" :value="topic">
                                    {{ topic.name }}
                                </option>
                            </select>
                            <button
                                type="button"
                                @click="showCreateTopic = true"
                                :disabled="!canCreateTopic"
                                class="px-4 py-3 border border-gray-300 rounded-lg font-medium transition-colors"
                                :class="canCreateTopic ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 cursor-not-allowed opacity-50'"
                                :title="canCreateTopic ? 'Create new topic' : 'Topic limit reached'"
                            >
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <!-- Topic Limit Warning -->
                        <div v-if="!canCreateTopic" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            Topic limit reached ({{ store.state.usage?.topics?.used || 0 }}/{{ store.state.usage?.topics?.limit || 3 }}).
                            <button v-if="store.state.subscriptionTier === 'free'" 
                                    @click="showUpgradeModal" 
                                    class="underline hover:no-underline ml-1">
                                Upgrade to Pro for unlimited topics
                            </button>
                        </div>
                        
                        <!-- Quick Topic Creation -->
                        <div v-if="showCreateTopic && canCreateTopic" class="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div class="flex space-x-3">
                                <input
                                    v-model="newTopicName"
                                    type="text"
                                    placeholder="Topic name (e.g., Algebra Basics)"
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    @keyup.enter="createTopicQuick"
                                />
                                <button
                                    type="button"
                                    @click="createTopicQuick"
                                    :disabled="!newTopicName.trim() || creatingTopic"
                                    class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <i v-if="creatingTopic" class="fas fa-spinner fa-spin"></i>
                                    <i v-else class="fas fa-check"></i>
                                </button>
                                <button
                                    type="button"
                                    @click="cancelCreateTopic"
                                    class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                                >
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- File Upload Area with Size Check -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">
                                <i class="fas fa-upload mr-2 text-gray-500"></i>Study Material
                            </label>
                            <div class="text-xs text-gray-500">
                                Max file size: {{ store.state.subscriptionTier === 'pro' ? '100MB' : '50MB' }}
                            </div>
                        </div>
                        
                        <!-- File Size Warning -->
                        <div v-if="selectedFile && fileSizeWarning" class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            {{ fileSizeWarning }}
                        </div>
                        
                        <!-- Drag & Drop Zone -->
                        <div
                            @drop="handleDrop"
                            @dragover="handleDragOver"
                            @dragleave="handleDragLeave"
                            @click="triggerFileInput"
                            :class="[
                                'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
                                isDragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50',
                                isUploading ? 'pointer-events-none opacity-75' : '',
                                !canUpload ? 'pointer-events-none opacity-50' : ''
                            ]"
                        >
                            <!-- Hidden File Input -->
                            <input
                                ref="fileInput"
                                type="file"
                                @change="handleFileChange"
                                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                                class="hidden"
                                :disabled="!canUpload"
                            />
                            
                            <!-- Storage Full Message -->
                            <div v-if="!canUpload" class="text-center">
                                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                                </div>
                                <p class="text-lg font-medium text-red-900 mb-2">Storage Full</p>
                                <p class="text-red-700 mb-2">You've reached your storage limit</p>
                                <button v-if="store.state.subscriptionTier === 'free'" 
                                        @click="showUpgradeModal" 
                                        class="text-red-800 underline hover:no-underline text-sm">
                                    Upgrade to Pro for 5GB storage
                                </button>
                            </div>
                            
                            <!-- Upload UI -->
                            <div v-else-if="!selectedFile">
                                <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-cloud-upload text-gray-400 text-2xl"></i>
                                </div>
                                <div>
                                    <p class="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
                                    <p class="text-gray-600 mb-2">Supports images, PDFs, Word documents, and text files</p>
                                    <p class="text-sm text-gray-500">
                                        Maximum file size: {{ store.state.subscriptionTier === 'pro' ? '100MB' : '50MB' }}
                                        • {{ Math.max(0, storageUsageLimitMB - storageUsedMB) }}MB storage available
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Selected File Preview -->
                            <div v-else class="flex items-center justify-center space-x-4">
                                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <i :class="getFileIcon(selectedFile)" class="text-primary-600 text-xl"></i>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                                    <p class="text-sm text-gray-600">{{ formatFileSize(selectedFile.size) }}</p>
                                    <p v-if="estimatedStorageAfterUpload > storageUsageLimitBytes" class="text-xs text-red-600">
                                        Will exceed storage limit!
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    @click.stop="removeFile"
                                    class="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <i class="fas fa-times text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- File Type Info with Subscription Benefits -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-medium text-blue-900 mb-2 flex items-center">
                            <i class="fas fa-info-circle mr-2"></i>
                            How File Processing Works
                        </h4>
                        <div class="text-sm text-blue-800 space-y-1">
                            <p><strong>📄 PDFs:</strong> Text is extracted automatically from all pages</p>
                            <p><strong>📷 Images:</strong> OCR technology converts handwritten/printed text to digital text</p>
                            <p><strong>📝 Documents:</strong> Text content is read directly from Word and text files</p>
                            <p><strong>🤖 AI Processing:</strong> Extracted text is used to generate practice questions</p>
                            <div v-if="store.state.subscriptionTier === 'pro'" class="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-800">
                                <i class="fas fa-crown mr-1"></i>
                                <strong>Pro Benefits:</strong> 100MB file limit, 5GB storage, unlimited topics
                            </div>
                        </div>
                    </div>

                    <!-- Upload Progress -->
                    <div v-if="isUploading" class="space-y-3">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-700 flex items-center">
                                <i class="fas fa-cog fa-spin mr-2 text-primary-500"></i>
                                {{ uploadStatus }}
                            </span>
                            <span class="font-medium">{{ Math.round(uploadProgress) }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                class="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
                                :style="{ width: uploadProgress + '%' }"
                            ></div>
                        </div>
                    </div>

                    <!-- Submit Button with Usage Check -->
                    <button
                        type="submit"
                        :disabled="!canSubmitUpload"
                        class="w-full py-4 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
                        :class="canSubmitUpload 
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
                    >
                        <i v-if="!isUploading" class="fas fa-upload mr-2"></i>
                        <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                        {{ getSubmitButtonText }}
                    </button>
                    
                    <!-- Upload Prevention Messages -->
                    <div v-if="!canSubmitUpload && selectedFile && selectedTopic" class="text-center">
                        <div v-if="!canUpload" class="text-sm text-red-600">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            Cannot upload: Storage limit reached
                        </div>
                        <div v-else-if="fileTooLarge" class="text-sm text-red-600">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            File too large for your subscription tier
                        </div>
                        <div v-else-if="estimatedStorageAfterUpload > storageUsageLimitBytes" class="text-sm text-red-600">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            File would exceed storage limit
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // Form state
        const selectedSubject = Vue.ref('');
        const selectedTopic = Vue.ref('');
        const availableTopics = Vue.ref([]);
        const selectedFile = Vue.ref(null);
        const isDragOver = Vue.ref(false);
        const isUploading = Vue.ref(false);
        const uploadProgress = Vue.ref(0);
        const uploadStatus = Vue.ref('');
        
        // Topic creation
        const showCreateTopic = Vue.ref(false);
        const newTopicName = Vue.ref('');
        const creatingTopic = Vue.ref(false);
        
        // File input ref
        const fileInput = Vue.ref(null);

        // Computed properties for usage
        const storageUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.storage;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const storageUsedMB = Vue.computed(() => {
            return Math.round((store.state.usage?.storage?.used || 0) / (1024 * 1024));
        });

        const storageUsageLimitMB = Vue.computed(() => {
            return Math.round((store.state.usage?.storage?.limit || 104857600) / (1024 * 1024));
        });

        const storageUsageLimitBytes = Vue.computed(() => {
            return store.state.usage?.storage?.limit || 104857600;
        });

        const canUpload = Vue.computed(() => {
            return storageUsagePercentage.value < 100;
        });

        const canCreateTopic = Vue.computed(() => {
            const usage = store.state.usage?.topics;
            if (!usage) return true;
            return usage.used < usage.limit;
        });

        const maxFileSize = Vue.computed(() => {
            return store.state.subscriptionTier === 'pro' ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
        });

        const fileTooLarge = Vue.computed(() => {
            return selectedFile.value && selectedFile.value.size > maxFileSize.value;
        });

        const estimatedStorageAfterUpload = Vue.computed(() => {
            const currentUsage = store.state.usage?.storage?.used || 0;
            const fileSize = selectedFile.value?.size || 0;
            return currentUsage + fileSize;
        });

        const fileSizeWarning = Vue.computed(() => {
            if (!selectedFile.value) return null;
            
            if (fileTooLarge.value) {
                return `File size (${formatFileSize(selectedFile.value.size)}) exceeds your limit (${formatFileSize(maxFileSize.value)}). ${store.state.subscriptionTier === 'free' ? 'Upgrade to Pro for 100MB files.' : ''}`;
            }
            
            if (estimatedStorageAfterUpload.value > storageUsageLimitBytes.value) {
                const overage = estimatedStorageAfterUpload.value - storageUsageLimitBytes.value;
                return `File would exceed storage limit by ${formatFileSize(overage)}. ${store.state.subscriptionTier === 'free' ? 'Upgrade to Pro for 5GB storage.' : ''}`;
            }
            
            return null;
        });

        const canSubmitUpload = Vue.computed(() => {
            return !isUploading.value && 
                   selectedFile.value && 
                   selectedTopic.value && 
                   canUpload.value && 
                   !fileTooLarge.value && 
                   estimatedStorageAfterUpload.value <= storageUsageLimitBytes.value;
        });

        const getSubmitButtonText = Vue.computed(() => {
            if (isUploading.value) return uploadStatus.value;
            if (!selectedFile.value) return 'Select a file to upload';
            if (!selectedTopic.value) return 'Select a topic first';
            if (!canUpload.value) return 'Storage limit reached';
            if (fileTooLarge.value) return 'File too large';
            if (estimatedStorageAfterUpload.value > storageUsageLimitBytes.value) return 'Would exceed storage limit';
            return 'Upload & Process File';
        });

        // Subjects
        const subjects = Vue.computed(() => store.state.subjects);

        // File handling methods
        const triggerFileInput = () => {
            if (canUpload.value && fileInput.value) {
                fileInput.value.click();
            }
        };

        const handleFileChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                selectedFile.value = file;
            }
        };

        const handleDrop = (event) => {
            event.preventDefault();
            isDragOver.value = false;
            
            if (!canUpload.value) return;
            
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                selectedFile.value = files[0];
            }
        };

        const handleDragOver = (event) => {
            event.preventDefault();
            if (canUpload.value) {
                isDragOver.value = true;
            }
        };

        const handleDragLeave = (event) => {
            event.preventDefault();
            isDragOver.value = false;
        };

        const removeFile = () => {
            selectedFile.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
        };

        const getFileIcon = (file) => {
            const ext = file.name.toLowerCase().split('.').pop();
            const icons = {
                pdf: 'fas fa-file-pdf',
                doc: 'fas fa-file-word',
                docx: 'fas fa-file-word',
                txt: 'fas fa-file-text',
                jpg: 'fas fa-file-image',
                jpeg: 'fas fa-file-image',
                png: 'fas fa-file-image',
                gif: 'fas fa-file-image'
            };
            return icons[ext] || 'fas fa-file';
        };

        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        // Subject and topic handling
        const handleSubjectChange = async () => {
            selectedTopic.value = '';
            availableTopics.value = [];
            
            if (selectedSubject.value) {
                try {
                    const topics = await window.api.getTopics(selectedSubject.value.id);
                    availableTopics.value = topics;
                } catch (error) {
                    console.error('Failed to load topics:', error);
                    store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        const createTopicQuick = async () => {
            if (!newTopicName.value.trim() || !selectedSubject.value || creatingTopic.value) return;
            
            creatingTopic.value = true;
            try {
                const newTopic = await window.api.createTopic(
                    selectedSubject.value.id,
                    newTopicName.value.trim(),
                    `Topic for ${selectedSubject.value.name}`
                );
                
                availableTopics.value.push(newTopic);
                selectedTopic.value = newTopic;
                newTopicName.value = '';
                showCreateTopic.value = false;
                
                store.showNotification('Topic created successfully!', 'success');
            } catch (error) {
                console.error('Failed to create topic:', error);
                store.showNotification('Failed to create topic: ' + error.message, 'error');
            } finally {
                creatingTopic.value = false;
            }
        };

        const cancelCreateTopic = () => {
            showCreateTopic.value = false;
            newTopicName.value = '';
        };

        // Upload handling
        const handleUpload = async () => {
            if (!canSubmitUpload.value) return;
            
            console.log('🔄 Starting upload process...');
            console.log('📁 Selected file:', selectedFile.value ? selectedFile.value.name : 'None');
            console.log('📚 Selected topic:', selectedTopic.value ? selectedTopic.value.name : 'None');
            console.log('👤 User authenticated:', window.api.isAuthenticated());
            console.log('🔑 Access token exists:', !!window.api.accessToken);
            
            isUploading.value = true;
            uploadProgress.value = 0;
            uploadStatus.value = 'Preparing upload...';
            
            try {
                uploadStatus.value = 'Uploading file...';
                uploadProgress.value = 25;
                
                console.log('📤 Calling uploadFile API...');
                const result = await window.api.uploadFile(selectedFile.value, selectedTopic.value.id, (progress) => {
                    uploadProgress.value = 25 + (progress * 0.5); // 25-75%
                    uploadStatus.value = `Uploading... ${Math.round(progress)}%`;
                    console.log(`📈 Upload progress: ${Math.round(progress)}%`);
                });
                
                console.log('✅ Upload API returned:', result);
                uploadStatus.value = 'Processing file...';
                uploadProgress.value = 85;
                
                // Update storage usage
                await store.loadUsageStats();
                
                uploadProgress.value = 100;
                uploadStatus.value = 'Upload complete!';
                
                store.showNotification(`File uploaded successfully! Extracted ${result.wordCount || 0} words.`, 'success');
                
                // Reset form
                selectedFile.value = null;
                if (fileInput.value) {
                    fileInput.value.value = '';
                }
                
                // Update statistics
                await store.updateStatistics();
                
            } catch (error) {
                console.error('❌ Upload failed with error:', error);
                console.error('❌ Error message:', error.message);
                console.error('❌ Error stack:', error.stack);
                
                let errorMessage = 'Upload failed. Please try again.';
                
                if (error.message.includes('Authentication required')) {
                    errorMessage = 'Please log in to upload files.';
                    console.error('❌ Authentication error - user not logged in');
                } else if (error.message.includes('limit')) {
                    errorMessage = 'Upload failed: ' + error.message;
                } else if (error.message.includes('401')) {
                    errorMessage = 'Authentication required. Please log in again.';
                    console.error('❌ 401 Unauthorized error');
                } else if (error.message.includes('403')) {
                    errorMessage = 'Upload limit reached. Please upgrade your plan.';
                    console.error('❌ 403 Forbidden error');
                } else if (error.message.includes('404')) {
                    errorMessage = 'Topic not found. Please select a valid topic.';
                    console.error('❌ 404 Not Found error');
                } else {
                    errorMessage = `Upload failed: ${error.message}`;
                }
                
                store.showNotification(errorMessage, 'error');
            } finally {
                isUploading.value = false;
                uploadProgress.value = 0;
                uploadStatus.value = '';
            }
        };

        const showUpgradeModal = () => {
            store.showNotification('Upgrade to Pro for more storage and features! Contact support for details.', 'info');
        };

        return {
            store,
            selectedSubject,
            selectedTopic,
            availableTopics,
            selectedFile,
            isDragOver,
            isUploading,
            uploadProgress,
            uploadStatus,
            showCreateTopic,
            newTopicName,
            creatingTopic,
            fileInput,
            subjects,
            storageUsagePercentage,
            storageUsedMB,
            storageUsageLimitMB,
            storageUsageLimitBytes,
            canUpload,
            canCreateTopic,
            maxFileSize,
            fileTooLarge,
            estimatedStorageAfterUpload,
            fileSizeWarning,
            canSubmitUpload,
            getSubmitButtonText,
            triggerFileInput,
            handleFileChange,
            handleDrop,
            handleDragOver,
            handleDragLeave,
            removeFile,
            getFileIcon,
            formatFileSize,
            handleSubjectChange,
            createTopicQuick,
            cancelCreateTopic,
            handleUpload,
            showUpgradeModal
        };
    }
};