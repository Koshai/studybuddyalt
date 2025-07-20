// src/frontend/components/Upload/UploadForm.js - FIXED VERSION
window.UploadFormComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
                <span class="mr-3">📤</span>Add Study Materials
            </h2>
            <p class="text-white/80 text-lg">Upload your notes, photos, PDFs, and documents!</p>
        </div>

        <div class="max-w-2xl mx-auto">
            <div class="content-card p-8">
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-cloud-upload text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Upload Study Materials</h3>
                    <p class="text-gray-600">Add documents, images, and notes to generate AI questions</p>
                </div>

                <form @submit.prevent="handleUpload" class="space-y-6">
                    <!-- Subject Selection -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <select
                            v-model="selectedSubject"
                            @change="handleSubjectChange"
                            class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                            required
                        >
                            <option value="">Select a subject...</option>
                            <option v-for="subject in store.state.subjects" :key="subject.id" :value="subject">
                                {{ subject.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Topic Selection -->
                    <div v-if="selectedSubject">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                        <select
                            v-model="selectedTopic"
                            class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                            required
                        >
                            <option value="">Select a topic...</option>
                            <option v-for="topic in availableTopics" :key="topic.id" :value="topic">
                                {{ topic.name }}
                            </option>
                        </select>
                    </div>

                    <!-- File Upload Area -->
                    <FileDropzone 
                        v-model="selectedFile"
                        :uploading="store.state.uploading"
                        :drag-over="store.state.dragOver"
                        @file-selected="handleFileSelected"
                        @drag-over="store.setDragOver(true)"
                        @drag-leave="store.setDragOver(false)"
                        @drop="handleDrop"
                    />

                    <!-- Upload Progress -->
                    <div v-if="store.state.uploading" class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-700">Processing file...</span>
                            <span class="font-medium">{{ Math.round(store.state.uploadProgress) }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                class="progress-bar h-2 rounded-full transition-all duration-300"
                                :style="{ width: store.state.uploadProgress + '%' }"
                            ></div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        :disabled="!canUpload"
                        class="w-full btn-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <i v-if="!store.state.uploading" class="fas fa-upload mr-2"></i>
                        <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                        {{ store.state.uploading ? 'Processing...' : 'Upload & Process' }}
                    </button>
                </form>

                <!-- Upload Result -->
                <div v-if="store.state.uploadResult" class="mt-8 p-6 bg-accent-50 border border-accent-200 rounded-xl">
                    <div class="flex items-center mb-4">
                        <div class="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-check text-white text-sm"></i>
                        </div>
                        <h4 class="font-semibold text-accent-800">Upload Successful</h4>
                    </div>
                    <p class="text-accent-700 mb-4">Your file has been processed and text extracted successfully.</p>
                    <div class="bg-white p-4 rounded-lg border border-accent-200">
                        <h5 class="font-medium text-gray-900 mb-2">Extracted Text Preview:</h5>
                        <p class="text-sm text-gray-700 max-h-32 overflow-y-auto">
                            {{ store.state.uploadResult.extractedText?.substring(0, 500) }}
                            <span v-if="store.state.uploadResult.extractedText?.length > 500" class="text-gray-500">...</span>
                        </p>
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

        const canUpload = Vue.computed(() => {
            return selectedFile.value && selectedSubject.value && selectedTopic.value && !store.state.uploading;
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

        const handleFileSelected = (file) => {
            selectedFile.value = file;
            store.setSelectedFile(file);
        };

        const handleDrop = (event) => {
            event.preventDefault();
            store.setDragOver(false);
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelected(files[0]);
            }
        };

        const handleUpload = async () => {
            if (!canUpload.value) return;

            store.setUploading(true);
            store.setUploadProgress(0);

            try {
                const result = await window.api.uploadFile(
                    selectedFile.value,
                    selectedSubject.value.id,
                    selectedTopic.value.id,
                    (progress) => store.setUploadProgress(progress)
                );

                store.setUploadResult(result);
                store.showNotification('File uploaded and processed successfully!', 'success');
                
                // Reset form
                selectedFile.value = null;
                store.setSelectedFile(null);
                document.getElementById('file-input')?.reset();
                
            } catch (error) {
                console.error('Upload error:', error);
                store.showNotification('Upload failed. Please try again.', 'error');
            } finally {
                store.setUploading(false);
            }
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
            canUpload,
            handleSubjectChange,
            handleFileSelected,
            handleDrop,
            handleUpload
        };
    }
};