// src/frontend/components/Forms/ValidatedInput.js - Validated Input Component
window.ValidatedInput = {
    template: `
        <div class="space-y-1">
            <!-- Label -->
            <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700">
                {{ label }}
                <span v-if="required" class="text-red-500 ml-1">*</span>
            </label>
            
            <!-- Input Field -->
            <div class="relative">
                <textarea
                    v-if="type === 'textarea'"
                    :id="inputId"
                    :value="modelValue"
                    :placeholder="placeholder"
                    :required="required"
                    :disabled="disabled"
                    :class="inputClasses"
                    :rows="validatorOptions.rows || 3"
                    @input="handleInput"
                    @blur="handleBlur"
                    @focus="handleFocus"
                    class="resize-none"
                />
                <input
                    v-else
                    :id="inputId"
                    :type="inputType"
                    :value="modelValue"
                    :placeholder="placeholder"
                    :required="required"
                    :disabled="disabled"
                    :class="inputClasses"
                    @input="handleInput"
                    @blur="handleBlur"
                    @focus="handleFocus"
                />
                
                <!-- Validation Icons -->
                <div v-if="showValidationIcons && touched && type !== 'textarea' && modelValue" class="absolute inset-y-0 right-0 flex items-center pr-3">
                    <i v-if="hasErrors" class="fas fa-exclamation-circle text-red-500"></i>
                    <i v-else-if="isValid && modelValue.trim()" class="fas fa-check-circle text-green-500"></i>
                </div>
                
                <!-- Validation Icons for Textarea -->
                <div v-if="showValidationIcons && touched && type === 'textarea' && modelValue" class="absolute top-3 right-3">
                    <i v-if="hasErrors" class="fas fa-exclamation-circle text-red-500"></i>
                    <i v-else-if="isValid && modelValue.trim()" class="fas fa-check-circle text-green-500"></i>
                </div>
                
                <!-- Password Toggle -->
                <button
                    v-if="type === 'password'"
                    type="button"
                    @click="togglePasswordVisibility"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
            </div>
            
            <!-- Password Strength Indicator -->
            <div v-if="type === 'password' && showPasswordStrength && modelValue && touched" class="mt-2">
                <div class="flex items-center space-x-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                            :class="strengthBarClass"
                            class="h-2 rounded-full transition-all duration-300"
                            :style="{ width: strengthWidth }"
                        ></div>
                    </div>
                    <span :class="strengthTextClass" class="text-sm font-medium">
                        {{ passwordStrength.text }}
                    </span>
                </div>
            </div>
            
            <!-- Error Messages -->
            <div v-if="hasErrors && touched" class="space-y-1">
                <p v-for="error in errors" :key="error" class="text-sm text-red-600 flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    {{ error }}
                </p>
            </div>
            
            <!-- Success Message -->
            <div v-else-if="successMessage && isValid && touched && modelValue && modelValue.trim()" class="space-y-1">
                <p class="text-sm text-green-600 flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    {{ successMessage }}
                </p>
            </div>
            
            <!-- Help Text -->
            <div v-if="helpText && !hasErrors" class="space-y-1">
                <p class="text-sm text-gray-500 flex items-start">
                    <i class="fas fa-info-circle mr-2 mt-0.5"></i>
                    {{ helpText }}
                </p>
            </div>
        </div>
    `,
    
    props: {
        modelValue: {
            type: [String, Number],
            default: ''
        },
        type: {
            type: String,
            default: 'text'
        },
        label: {
            type: String,
            default: null
        },
        placeholder: {
            type: String,
            default: ''
        },
        required: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        validator: {
            type: Function,
            default: null
        },
        validatorOptions: {
            type: Object,
            default: () => ({})
        },
        showValidationIcons: {
            type: Boolean,
            default: true
        },
        showPasswordStrength: {
            type: Boolean,
            default: true
        },
        successMessage: {
            type: String,
            default: null
        },
        helpText: {
            type: String,
            default: null
        },
        validateOnInput: {
            type: Boolean,
            default: true
        },
        debounceMs: {
            type: Number,
            default: 300
        }
    },
    
    setup(props, { emit }) {
        const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
        const touched = Vue.ref(false);
        const focused = Vue.ref(false);
        const showPassword = Vue.ref(false);
        const validationState = Vue.ref({
            isValid: true,
            errors: [],
            strength: null
        });
        
        const inputType = Vue.computed(() => {
            if (props.type === 'password') {
                return showPassword.value ? 'text' : 'password';
            }
            return props.type;
        });
        
        const isValid = Vue.computed(() => validationState.value.isValid);
        const errors = Vue.computed(() => validationState.value.errors);
        const hasErrors = Vue.computed(() => errors.value.length > 0);
        const passwordStrength = Vue.computed(() => validationState.value.strength || { score: 0, text: 'Very Weak', color: 'red' });
        
        const inputClasses = Vue.computed(() => {
            const baseClasses = [
                'w-full px-4 py-3 border rounded-lg transition-colors duration-200',
                'focus:ring-2 focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed'
            ];
            
            if (props.disabled) {
                baseClasses.push('bg-gray-100 border-gray-300');
            } else if (hasErrors.value && touched.value) {
                baseClasses.push('border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50');
            } else if (isValid.value && props.modelValue && touched.value && props.modelValue.trim()) {
                baseClasses.push('border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50');
            } else if (focused.value) {
                baseClasses.push('border-blue-500 focus:ring-blue-500 focus:border-blue-500');
            } else {
                baseClasses.push('border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white');
            }
            
            return baseClasses.join(' ');
        });
        
        const strengthWidth = Vue.computed(() => {
            const score = passwordStrength.value.score;
            return `${Math.max((score / 7) * 100, 10)}%`;
        });
        
        const strengthBarClass = Vue.computed(() => {
            const colorMap = {
                red: 'bg-red-500',
                orange: 'bg-orange-500',
                yellow: 'bg-yellow-500',
                blue: 'bg-blue-500',
                green: 'bg-green-500'
            };
            return colorMap[passwordStrength.value.color] || 'bg-gray-500';
        });
        
        const strengthTextClass = Vue.computed(() => {
            const colorMap = {
                red: 'text-red-600',
                orange: 'text-orange-600',
                yellow: 'text-yellow-600',
                blue: 'text-blue-600',
                green: 'text-green-600'
            };
            return colorMap[passwordStrength.value.color] || 'text-gray-600';
        });
        
        const validateValue = (value) => {
            if (!props.validator) {
                validationState.value = { isValid: true, errors: [], strength: null };
                emit('validation-change', {
                    isValid: true,
                    errors: [],
                    field: props.label || 'field'
                });
                return;
            }
            
            // For empty values, be more lenient
            if (!value || value.trim() === '') {
                const emptyResult = { isValid: true, errors: [], strength: null };
                validationState.value = emptyResult;
                emit('validation-change', {
                    isValid: true,
                    errors: [],
                    field: props.label || 'field'
                });
                return;
            }
            
            const result = props.validator(value, props.validatorOptions);
            validationState.value = {
                isValid: result.isValid,
                errors: result.errors || [],
                strength: result.strength || null
            };
            
            emit('validation-change', {
                isValid: result.isValid,
                errors: result.errors || [],
                field: props.label || 'field'
            });
        };
        
        const debouncedValidate = window.ValidationUtils.debounce(validateValue, props.debounceMs);
        
        const handleInput = (event) => {
            const value = event.target.value;
            emit('update:modelValue', value);
            
            if (props.validateOnInput && touched.value) {
                debouncedValidate(value);
            }
        };
        
        const handleBlur = () => {
            touched.value = true;
            focused.value = false;
            validateValue(props.modelValue);
        };
        
        const handleFocus = () => {
            focused.value = true;
        };
        
        const togglePasswordVisibility = () => {
            showPassword.value = !showPassword.value;
        };
        
        // Watch for external validation triggers
        Vue.watch(() => props.modelValue, (newValue) => {
            if (touched.value) {
                validateValue(newValue);
            }
        });
        
        // Initial validation if there's a value
        Vue.onMounted(() => {
            if (props.modelValue) {
                validateValue(props.modelValue);
            }
        });
        
        return {
            inputId,
            inputType,
            touched,
            focused,
            showPassword,
            isValid,
            errors,
            hasErrors,
            passwordStrength,
            inputClasses,
            strengthWidth,
            strengthBarClass,
            strengthTextClass,
            handleInput,
            handleBlur,
            handleFocus,
            togglePasswordVisibility
        };
    }
};