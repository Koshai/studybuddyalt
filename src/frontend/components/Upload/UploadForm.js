// src/frontend/components/Upload/UploadForm.js - FIXED VERSION with working file upload
window.UploadFormComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-black mb-4">
                <span class="mr-3">📤</span>Add Study Materials
            </h2>
            <p class="text-black/80 text-lg">Upload your notes, photos, PDFs, and documents for AI analysis!</p>
        </div>

        <div class="max-w-2xl mx-auto">
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Header -->
                <div class="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-cloud-upload text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Upload Study Materials</h3>
                        <p class="text-gray-600">AI will extract text and generate questions automatically</p>
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
                            <option v-for="subject in store.state.subjects" :key="subject.id" :value="subject">
                                {{ subject.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Topic Selection -->
                    <div v-if="selectedSubject">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-file-alt mr-2 text-gray-500"></i>Topic
                        </label>
                        <select
                            v-model="selectedTopic"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            required
                        >
                            <option value="">Choose a topic...</option>
                            <option v-for="topic in availableTopics" :key="topic.id" :value="topic">
                                {{ topic.name }}
                            </option>
                        </select>
                    </div>

                    <!-- File Upload Area -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-upload mr-2 text-gray-500"></i>Study Material
                        </label>
                        
                        <!-- Drag & Drop Zone -->
                        <div
                            @drop="handleDrop"
                            @dragover="handleDragOver"
                            @dragleave="handleDragLeave"
                            @click="triggerFileInput"
                            :class="[
                                'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
                                isDragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50',
                                isUploading ? 'pointer-events-none opacity-75' : ''
                            ]"
                        >
                            <!-- Hidden File Input -->
                            <input
                                ref="fileInput"
                                type="file"
                                @change="handleFileChange"
                                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                                class="hidden"
                            />
                            
                            <!-- Upload UI -->
                            <div v-if="!selectedFile">
                                <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-cloud-upload text-gray-400 text-2xl"></i>
                                </div>
                                <div>
                                    <p class="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
                                    <p class="text-gray-600 mb-2">Supports images, PDFs, Word documents, and text files</p>
                                    <p class="text-sm text-gray-500">Maximum file size: 50MB</p>
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

                    <!-- File Type Info -->
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

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        :disabled="!canUpload"
                        class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                    >
                        <i v-if="!isUploading" class="fas fa-upload mr-2"></i>
                        <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                        {{ isUploading ? uploadStatus : 'Upload & Process File' }}
                    </button>
                </form>

                <!-- Upload Result -->
                <div v-if="uploadResult" class="p-6 pt-0">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-check text-white"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-green-800">Upload Successful!</h4>
                                <p class="text-green-700">Your file has been processed and text extracted</p>
                            </div>
                        </div>
                        
                        <!-- Extracted Text Preview -->
                        <div class="bg-white p-4 rounded-lg border border-green-200">
                            <h5 class="font-medium text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-eye mr-2 text-gray-500"></i>
                                Extracted Text Preview
                            </h5>
                            <div class="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                                <p class="text-sm text-gray-700 whitespace-pre-wrap">
                                    {{ getTextPreview(uploadResult.extractedText) }}
                                </p>
                            </div>
                            <div class="mt-3 flex items-center justify-between text-sm text-gray-600">
                                <span>{{ getWordCount(uploadResult.extractedText) }} words extracted</span>
                                <button 
                                    @click="generateQuestionsNow"
                                    class="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Generate Questions Now →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const selectedSubject = Vue.ref(null);
        const selectedTopic = Vue.ref(null);
        const selectedFile = Vue.ref(null);
        const availableTopics = Vue.ref([]);
        const isDragOver = Vue.ref(false);
        const isUploading = Vue.ref(false);
        const uploadProgress = Vue.ref(0);
        const uploadStatus = Vue.ref('');
        const uploadResult = Vue.ref(null);
        const fileInput = Vue.ref(null);

        const canUpload = Vue.computed(() => {
            return selectedFile.value && selectedSubject.value && selectedTopic.value && !isUploading.value;
        });

        const handleSubjectChange = async () => {
            selectedTopic.value = null;
            availableTopics.value = [];
            
            if (selectedSubject.value) {
                try {
                    const topics = await window.api.getTopics(selectedSubject.value.id);
                    availableTopics.value = topics;
                } catch (error) {
                    store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        const triggerFileInput = () => {
            if (!isUploading.value) {
                fileInput.value.click();
            }
        };

        const handleFileChange = (event) => {
            const file = event.target.files[0];
            if (file && validateFile(file)) {
                selectedFile.value = file;
                uploadResult.value = null;
            }
        };

        const handleDrop = (event) => {
            event.preventDefault();
            isDragOver.value = false;
            
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (validateFile(file)) {
                    selectedFile.value = file;
                    uploadResult.value = null;
                }
            }
        };

        const handleDragOver = (event) => {
            event.preventDefault();
            isDragOver.value = true;
        };

        const handleDragLeave = (event) => {
            event.preventDefault();
            isDragOver.value = false;
        };

        const removeFile = () => {
            selectedFile.value = null;
            uploadResult.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
        };

        const validateFile = (file) => {
            const maxSize = 50 * 1024 * 1024; // 50MB
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (file.size > maxSize) {
                store.showNotification('File size exceeds 50MB limit', 'error');
                return false;
            }

            if (!allowedTypes.includes(file.type)) {
                store.showNotification('File type not supported', 'error');
                return false;
            }

            return true;
        };

        const handleUpload = async () => {
            if (!canUpload.value) return;

            isUploading.value = true;
            uploadProgress.value = 0;
            uploadStatus.value = 'Uploading file...';

            try {
                const formData = new FormData();
                formData.append('file', selectedFile.value);
                formData.append('subjectId', selectedSubject.value.id);
                formData.append('topicId', selectedTopic.value.id);

                // Use XMLHttpRequest for progress tracking
                const xhr = new XMLHttpRequest();
                
                // Track upload progress
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        uploadProgress.value = percentComplete;
                        
                        if (percentComplete < 100) {
                            uploadStatus.value = 'Uploading file...';
                        } else {
                            uploadStatus.value = 'Processing file...';
                        }
                    }
                });

                // Handle completion
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            uploadResult.value = result;
                            store.showNotification('File uploaded and processed successfully!', 'success');
                            
                            // Reset form
                            selectedFile.value = null;
                            if (fileInput.value) {
                                fileInput.value.value = '';
                            }
                        } catch (error) {
                            store.showNotification('Invalid response from server', 'error');
                        }
                    } else {
                        store.showNotification(`Upload failed: ${xhr.status} ${xhr.statusText}`, 'error');
                    }
                    isUploading.value = false;
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    store.showNotification('Upload failed - network error', 'error');
                    isUploading.value = false;
                });

                // Send the request
                xhr.open('POST', 'http://localhost:3001/api/upload');
                xhr.send(formData);

            } catch (error) {
                console.error('Upload error:', error);
                store.showNotification('Upload failed. Please try again.', 'error');
                isUploading.value = false;
            }
        };

        const generateQuestionsNow = async () => {
            if (!selectedTopic.value) return;

            try {
                store.setGenerating(true);
                const questions = await window.api.generateQuestions(selectedTopic.value.id, 5, 'medium');
                store.showNotification('Questions generated successfully!', 'success');
                store.selectTopic(selectedTopic.value);
                store.setCurrentView('practice');
            } catch (error) {
                store.showNotification('Failed to generate questions', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        const getFileIcon = (file) => {
            if (!file) return 'fas fa-file';
            
            const type = file.type;
            if (type.startsWith('image/')) return 'fas fa-image';
            if (type === 'application/pdf') return 'fas fa-file-pdf';
            if (type.includes('word')) return 'fas fa-file-word';
            if (type === 'text/plain') return 'fas fa-file-alt';
            return 'fas fa-file';
        };

        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const getTextPreview = (text) => {
            if (!text) return 'No text extracted';
            return text.length > 300 ? text.substring(0, 300) + '...' : text;
        };

        const getWordCount = (text) => {
            if (!text) return 0;
            return text.trim().split(/\s+/).length;
        };

        // Load subjects on mount
        Vue.onMounted(async () => {
            if (store.state.subjects.length === 0) {
                try {
                    const subjects = await window.api.getSubjects();
                    store.setSubjects(subjects);
                } catch (error) {
                    store.showNotification('Failed to load subjects', 'error');
                }
            }
        });

        return {
            store,
            selectedSubject,
            selectedTopic,
            selectedFile,
            availableTopics,
            isDragOver,
            isUploading,
            uploadProgress,
            uploadStatus,
            uploadResult,
            fileInput,
            canUpload,
            handleSubjectChange,
            triggerFileInput,
            handleFileChange,
            handleDrop,
            handleDragOver,
            handleDragLeave,
            removeFile,
            handleUpload,
            generateQuestionsNow,
            getFileIcon,
            formatFileSize,
            getTextPreview,
            getWordCount
        };
    }
};