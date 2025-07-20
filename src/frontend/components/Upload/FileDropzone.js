// src/frontend/components/Upload/FileDropzone.js
window.FileDropzone = {
    props: {
        modelValue: {
            type: File,
            default: null
        },
        uploading: {
            type: Boolean,
            default: false
        },
        dragOver: {
            type: Boolean,
            default: false
        }
    },

    template: `
    <div
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        :class="[
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400',
            uploading ? 'pointer-events-none opacity-75' : ''
        ]"
        @click="triggerFileInput"
    >
        <input
            ref="fileInput"
            type="file"
            @change="handleFileChange"
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            class="hidden"
            id="file-input"
        />
        
        <div v-if="!modelValue">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-file-upload text-gray-400 text-xl"></i>
            </div>
            <div>
                <span class="text-lg font-medium text-gray-900">Drop files here or click to browse</span>
                <p class="text-gray-600 mt-1">Supports images, PDFs, Word documents, and text files</p>
                <p class="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
            </div>
        </div>
        
        <div v-else class="flex items-center justify-center space-x-4">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <i :class="getFileIcon(modelValue)" class="text-primary-600 text-xl"></i>
            </div>
            <div class="text-left">
                <p class="font-medium text-gray-900">{{ modelValue.name }}</p>
                <p class="text-sm text-gray-600">{{ formatFileSize(modelValue.size) }}</p>
            </div>
            <button
                type="button"
                @click.stop="removeFile"
                class="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
    `,

    setup(props, { emit }) {
        const fileInput = Vue.ref(null);

        const handleDrop = (event) => {
            event.preventDefault();
            emit('drag-leave');
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (validateFile(file)) {
                    emit('update:modelValue', file);
                    emit('file-selected', file);
                }
            }
        };

        const handleDragOver = (event) => {
            event.preventDefault();
            emit('drag-over');
        };

        const handleDragLeave = (event) => {
            event.preventDefault();
            emit('drag-leave');
        };

        const handleFileChange = (event) => {
            const file = event.target.files[0];
            if (file && validateFile(file)) {
                emit('update:modelValue', file);
                emit('file-selected', file);
            }
        };

        const triggerFileInput = () => {
            if (!props.uploading) {
                fileInput.value.click();
            }
        };

        const removeFile = () => {
            emit('update:modelValue', null);
            emit('file-selected', null);
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
                window.store.showNotification('File size exceeds 50MB limit', 'error');
                return false;
            }

            if (!allowedTypes.includes(file.type)) {
                window.store.showNotification('File type not supported', 'error');
                return false;
            }

            return true;
        };

        const getFileIcon = (file) => {
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

        return {
            fileInput,
            handleDrop,
            handleDragOver,
            handleDragLeave,
            handleFileChange,
            triggerFileInput,
            removeFile,
            getFileIcon,
            formatFileSize
        };
    },

    emits: ['update:modelValue', 'file-selected', 'drag-over', 'drag-leave', 'drop']
};