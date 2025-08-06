// src/frontend/js/validation-utils.js - Form Validation Utilities
window.ValidationUtils = {
    // Email validation
    validateEmail(email) {
        const errors = [];
        
        if (!email || email.trim() === '') {
            errors.push('Email is required');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('Please enter a valid email address');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null
        };
    },

    // Password validation
    validatePassword(password, options = {}) {
        const {
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumbers = true,
            requireSpecialChars = false
        } = options;
        
        const errors = [];
        
        if (!password || password.trim() === '') {
            errors.push('Password is required');
        } else {
            if (password.length < minLength) {
                errors.push(`Password must be at least ${minLength} characters long`);
            }
            
            if (requireUppercase && !/[A-Z]/.test(password)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            
            if (requireLowercase && !/[a-z]/.test(password)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            
            if (requireNumbers && !/\d/.test(password)) {
                errors.push('Password must contain at least one number');
            }
            
            if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errors.push('Password must contain at least one special character');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null,
            strength: this.getPasswordStrength(password)
        };
    },

    // Password strength calculation
    getPasswordStrength(password) {
        if (!password) return { score: 0, text: 'Very Weak', color: 'red' };
        
        let score = 0;
        
        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Character types
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        
        // Complexity
        if (password.length >= 16) score += 1;
        
        const strengthLevels = [
            { score: 0, text: 'Very Weak', color: 'red' },
            { score: 1, text: 'Very Weak', color: 'red' },
            { score: 2, text: 'Weak', color: 'orange' },
            { score: 3, text: 'Fair', color: 'yellow' },
            { score: 4, text: 'Good', color: 'blue' },
            { score: 5, text: 'Strong', color: 'green' },
            { score: 6, text: 'Very Strong', color: 'green' },
            { score: 7, text: 'Excellent', color: 'green' }
        ];
        
        return strengthLevels[Math.min(score, strengthLevels.length - 1)];
    },

    // Name validation
    validateName(name, fieldName = 'Name') {
        const errors = [];
        
        if (!name || name.trim() === '') {
            errors.push(`${fieldName} is required`);
        } else {
            if (name.trim().length < 2) {
                errors.push(`${fieldName} must be at least 2 characters long`);
            }
            
            if (name.trim().length > 50) {
                errors.push(`${fieldName} must be less than 50 characters`);
            }
            
            // Only allow letters, spaces, hyphens, and apostrophes
            if (!/^[a-zA-Z\s\-']+$/.test(name)) {
                errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null
        };
    },

    // Confirm password validation
    validatePasswordConfirmation(password, confirmPassword) {
        const errors = [];
        
        if (!confirmPassword || confirmPassword.trim() === '') {
            errors.push('Please confirm your password');
        } else if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null
        };
    },

    // Topic name validation
    validateTopicName(name) {
        const errors = [];
        
        if (!name || name.trim() === '') {
            errors.push('Topic name is required');
        } else {
            if (name.trim().length < 3) {
                errors.push('Topic name must be at least 3 characters long');
            }
            
            if (name.trim().length > 100) {
                errors.push('Topic name must be less than 100 characters');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null
        };
    },

    // Description validation
    validateDescription(description, options = {}) {
        const { required = false, maxLength = 500 } = options;
        const errors = [];
        
        if (required && (!description || description.trim() === '')) {
            errors.push('Description is required');
        } else if (description && description.trim().length > maxLength) {
            errors.push(`Description must be less than ${maxLength} characters`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            firstError: errors[0] || null
        };
    },

    // Debounce utility for real-time validation
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validation state helper
    getValidationClass(isValid, hasError, touched = true) {
        if (!touched) return '';
        
        if (hasError) {
            return 'border-red-500 focus:ring-red-500 focus:border-red-500';
        } else if (isValid) {
            return 'border-green-500 focus:ring-green-500 focus:border-green-500';
        }
        
        return '';
    }
};

// Create reactive validation composable
window.useFormValidation = () => {
    const validation = Vue.reactive({});
    
    const validateField = (fieldName, value, validator, options = {}) => {
        const result = validator(value, options);
        
        Vue.set(validation, fieldName, {
            isValid: result.isValid,
            errors: result.errors,
            firstError: result.firstError,
            touched: true,
            strength: result.strength || null
        });
        
        return result;
    };
    
    const touchField = (fieldName) => {
        if (validation[fieldName]) {
            validation[fieldName].touched = true;
        }
    };
    
    const resetValidation = () => {
        Object.keys(validation).forEach(key => {
            delete validation[key];
        });
    };
    
    const isFormValid = () => {
        return Object.values(validation).every(field => field.isValid);
    };
    
    const hasErrors = () => {
        return Object.values(validation).some(field => field.errors.length > 0);
    };
    
    return {
        validation,
        validateField,
        touchField,
        resetValidation,
        isFormValid,
        hasErrors
    };
};