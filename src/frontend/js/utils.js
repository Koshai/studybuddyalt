// src/frontend/js/utils.js - Utility functions

/**
 * Utility functions for the StudyAI application
 */

// Date and time utilities
export const DateUtils = {
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    },

    formatDateTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleString();
    },

    formatRelativeTime(date) {
        if (!date) return '';
        const now = new Date();
        const targetDate = new Date(date);
        const diffMs = now - targetDate;
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return this.formatDate(date);
    },

    isToday(date) {
        const today = new Date();
        const targetDate = new Date(date);
        return today.toDateString() === targetDate.toDateString();
    }
};

// File utilities
export const FileUtils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    getFileType(filename) {
        const ext = this.getFileExtension(filename).toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const documentTypes = ['pdf', 'doc', 'docx', 'txt'];
        
        if (imageTypes.includes(ext)) return 'image';
        if (documentTypes.includes(ext)) return 'document';
        return 'unknown';
    },

    getFileIcon(filename) {
        const type = this.getFileType(filename);
        const ext = this.getFileExtension(filename).toLowerCase();
        
        if (type === 'image') return 'fas fa-image';
        if (ext === 'pdf') return 'fas fa-file-pdf';
        if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word';
        if (ext === 'txt') return 'fas fa-file-alt';
        return 'fas fa-file';
    },

    validateFile(file, maxSize = 50 * 1024 * 1024) {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${this.formatFileSize(maxSize)} limit`);
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('File type not supported');
        }

        return true;
    }
};

// String utilities
export const StringUtils = {
    truncate(str, length = 100, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    },

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    extractInitials(name, count = 2) {
        if (!name) return '';
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, count)
            .join('');
    },

    highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// Number utilities
export const NumberUtils = {
    formatPercentage(value, decimals = 0) {
        return `${Number(value).toFixed(decimals)}%`;
    },

    formatNumber(value, decimals = 0) {
        return Number(value).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// Array utilities
export const ArrayUtils = {
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    },

    unique(array, key = null) {
        if (!key) {
            return [...new Set(array)];
        }
        return array.filter((item, index, self) =>
            index === self.findIndex(t => t[key] === item[key])
        );
    },

    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

// DOM utilities
export const DOMUtils = {
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    },

    addClass(element, className) {
        element.classList.add(className);
    },

    removeClass(element, className) {
        element.classList.remove(className);
    },

    toggleClass(element, className) {
        element.classList.toggle(className);
    },

    hasClass(element, className) {
        return element.classList.contains(className);
    }
};

// Local storage utilities
export const StorageUtils = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
            return false;
        }
    }
};

// Debounce and throttle utilities
export const PerformanceUtils = {
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Color utilities
export const ColorUtils = {
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    getContrastColor(hexColor) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return '#000000';
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 125 ? '#000000' : '#ffffff';
    },

    generateRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }
};

// Validation utilities
export const ValidationUtils = {
    isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    isEmpty(value) {
        return value === null || value === undefined || 
               (typeof value === 'string' && value.trim() === '') ||
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    },

    isNumber(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }
};

// Async utilities
export const AsyncUtils = {
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    timeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Operation timed out')), ms)
            )
        ]);
    },

    retry(fn, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            fn()
                .then(resolve)
                .catch((error) => {
                    if (retries > 0) {
                        setTimeout(() => {
                            this.retry(fn, retries - 1, delay * 2)
                                .then(resolve)
                                .catch(reject);
                        }, delay);
                    } else {
                        reject(error);
                    }
                });
        });
    }
};

// Export all utilities as a single object for global access
window.Utils = {
    DateUtils,
    FileUtils,
    StringUtils,
    NumberUtils,
    ArrayUtils,
    DOMUtils,
    StorageUtils,
    PerformanceUtils,
    ColorUtils,
    ValidationUtils,
    AsyncUtils
};

// Also make individual utilities available
Object.assign(window, {
    DateUtils,
    FileUtils,
    StringUtils,
    NumberUtils,
    ArrayUtils,
    DOMUtils,
    StorageUtils,
    PerformanceUtils,
    ColorUtils,
    ValidationUtils,
    AsyncUtils
});

console.log('📦 Utils loaded successfully!');