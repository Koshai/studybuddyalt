// src/frontend/components/Practice/MCQQuestionCard.js - MCQ-ONLY VERSION
window.MCQQuestionCard = {
    template: `
    <div class="content-card p-8">
        <!-- Question Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
                <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {{ store.state.currentQuestionIndex + 1 }}
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-gray-900">Question {{ store.state.currentQuestionIndex + 1 }} of {{ store.state.questions.length }}</h3>
                    <p class="text-sm text-gray-600">{{ store.state.selectedTopic?.name }} • Multiple Choice</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <span :class="getDifficultyClass(currentQuestion?.difficulty)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ getDifficultyEmoji(currentQuestion?.difficulty) }} {{ currentQuestion?.difficulty || 'medium' }}
                </span>
                
                <!-- Progress Dots -->
                <div class="flex space-x-1">
                    <div v-for="i in store.state.questions.length" :key="i" 
                         :class="[
                             'w-3 h-3 rounded-full transition-all duration-300',
                             i <= store.state.currentQuestionIndex + 1 ? 'bg-blue-500 scale-110' : 'bg-gray-300'
                         ]">
                    </div>
                </div>
            </div>
        </div>

        <!-- Question Content -->
        <div class="mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6">
                <div class="flex items-start space-x-4">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <i class="fas fa-question text-white text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-blue-900 mb-3 text-lg">Question:</h4>
                        <p class="text-lg text-blue-800 leading-relaxed">{{ currentQuestion?.question }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Multiple Choice Options -->
        <div class="mb-8">
            <h4 class="font-medium text-gray-700 mb-4 text-lg">Choose the best answer:</h4>
            <div class="space-y-3">
                <button
                    v-for="(option, index) in currentQuestion?.options"
                    :key="index"
                    @click="selectOption(index)"
                    :disabled="store.state.showAnswer"
                    :class="[
                        'w-full text-left p-4 rounded-xl border-2 transition-all duration-300 transform',
                        getOptionClass(index),
                        'hover:scale-[1.02] active:scale-[0.98]'
                    ]"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <span :class="[
                                'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300',
                                getOptionBadgeClass(index)
                            ]">
                                {{ String.fromCharCode(65 + index) }}
                            </span>
                            <span class="flex-1 text-lg">{{ option }}</span>
                        </div>
                        <div v-if="store.state.showAnswer" class="flex items-center">
                            <i v-if="index === getCorrectIndex()" class="fas fa-check-circle text-green-600 text-xl"></i>
                            <i v-else-if="selectedChoice === index && index !== getCorrectIndex()" class="fas fa-times-circle text-red-600 text-xl"></i>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <button
                v-if="!store.state.showAnswer"
                @click="checkAnswer"
                :disabled="selectedChoice === null"
                class="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
                <i class="fas fa-check mr-3"></i>
                Check Answer
            </button>
            
            <button
                v-else
                @click="nextQuestion"
                class="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
                <i :class="[
                    'mr-3',
                    store.state.currentQuestionIndex < store.state.questions.length - 1 ? 'fas fa-arrow-right' : 'fas fa-flag-checkered'
                ]"></i>
                {{ store.state.currentQuestionIndex < store.state.questions.length - 1 ? 'Next Question' : 'Finish Practice' }}
            </button>

            <button
                v-if="!store.state.showAnswer"
                @click="skipQuestion"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-4 rounded-xl font-medium transition-colors"
            >
                <i class="fas fa-forward mr-2"></i>
                Skip
            </button>
        </div>

        <!-- Answer Feedback -->
        <div v-if="store.state.showAnswer" class="space-y-6">
            <!-- Result Badge -->
            <div class="flex items-center justify-center mb-6">
                <div :class="[
                    'px-8 py-4 rounded-2xl font-bold text-xl flex items-center space-x-3 shadow-lg',
                    lastAnswerCorrect ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-red-100 text-red-800 border-2 border-red-300'
                ]">
                    <i :class="lastAnswerCorrect ? 'fas fa-check-circle text-2xl' : 'fas fa-times-circle text-2xl'"></i>
                    <span>{{ lastAnswerCorrect ? 'Correct!' : 'Incorrect' }}</span>
                    <div class="text-lg font-medium opacity-75">
                        ({{ store.state.score.correct }}/{{ store.state.score.total }})
                    </div>
                </div>
            </div>

            <!-- Answer Summary -->
            <div class="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Your Answer -->
                    <div>
                        <div class="flex items-center mb-3">
                            <div :class="[
                                'w-8 h-8 rounded-full flex items-center justify-center mr-3',
                                lastAnswerCorrect ? 'bg-green-500' : 'bg-red-500'
                            ]">
                                <i :class="lastAnswerCorrect ? 'fas fa-check text-white' : 'fas fa-times text-white'"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900">Your Answer</h4>
                        </div>
                        <div :class="[
                            'p-3 rounded-lg border-2',
                            lastAnswerCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        ]">
                            <p :class="[
                                'font-medium',
                                lastAnswerCorrect ? 'text-green-800' : 'text-red-800'
                            ]">
                                {{ String.fromCharCode(65 + selectedChoice) }}. {{ currentQuestion?.options[selectedChoice] }}
                            </p>
                        </div>
                    </div>

                    <!-- Correct Answer -->
                    <div>
                        <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-lightbulb text-white"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900">Correct Answer</h4>
                        </div>
                        <div class="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <p class="text-blue-800 font-medium">
                                {{ String.fromCharCode(65 + getCorrectIndex()) }}. {{ getCorrectOption() }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Explanation Section -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border-l-4 border-indigo-400 rounded-lg p-6">
                <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-graduation-cap text-white"></i>
                    </div>
                    <h4 class="text-xl font-semibold text-indigo-900">Explanation</h4>
                </div>
                
                <div class="bg-white p-4 rounded-lg border border-indigo-200">
                    <p class="text-gray-800 leading-relaxed">{{ getExplanationText() }}</p>
                </div>
            </div>

            <!-- Performance Insight -->
            <div class="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-chart-line text-white"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-blue-900">Your Progress</h4>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{{ store.accuracyPercentage }}%</div>
                        <div class="text-sm text-blue-700">Current Accuracy</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{{ store.state.currentQuestionIndex + 1 }}</div>
                        <div class="text-sm text-blue-700">Questions Answered</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{{ store.state.questions.length - store.state.currentQuestionIndex - 1 }}</div>
                        <div class="text-sm text-blue-700">Remaining</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const selectedChoice = Vue.ref(null);
        const lastAnswerCorrect = Vue.ref(false);

        const currentQuestion = Vue.computed(() => {
            return store.currentQuestion;
        });

        const getCorrectIndex = () => {
            if (!currentQuestion.value) return -1;
            const correctIndex = currentQuestion.value.correct_index ?? currentQuestion.value.correctIndex;
            return correctIndex ?? -1;
        };

        const getCorrectOption = () => {
            const index = getCorrectIndex();
            if (index >= 0 && currentQuestion.value?.options && index < currentQuestion.value.options.length) {
                return currentQuestion.value.options[index];
            }
            return 'Unknown';
        };

        const selectOption = (index) => {
            if (!store.state.showAnswer) {
                selectedChoice.value = index;
            }
        };

        const checkAnswer = () => {
            if (selectedChoice.value === null) return;
            
            const correctIndex = getCorrectIndex();
            const isCorrect = selectedChoice.value === correctIndex;
            
            lastAnswerCorrect.value = isCorrect;
            store.submitAnswer(isCorrect);
        };

        const nextQuestion = () => {
            selectedChoice.value = null;
            store.nextQuestion();
        };

        const skipQuestion = () => {
            store.submitAnswer(false);
            lastAnswerCorrect.value = false;
        };

        const getDifficultyClass = (difficulty) => {
            const classes = {
                'easy': 'bg-green-100 text-green-700 border border-green-300',
                'medium': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
                'hard': 'bg-red-100 text-red-700 border border-red-300'
            };
            return classes[difficulty] || classes.medium;
        };

        const getDifficultyEmoji = (difficulty) => {
            const emojis = {
                'easy': '🟢',
                'medium': '🟡',
                'hard': '🔴'
            };
            return emojis[difficulty] || '🟡';
        };

        const getOptionClass = (index) => {
            const correctIndex = getCorrectIndex();
            
            if (!store.state.showAnswer) {
                return selectedChoice.value === index 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50';
            }
            
            if (index === correctIndex) {
                return 'border-green-500 bg-green-50';
            } else if (selectedChoice.value === index) {
                return 'border-red-500 bg-red-50';
            }
            return 'border-gray-200 bg-gray-50';
        };

        const getExplanationText = () => {
            if (!currentQuestion.value) return 'No explanation available.';
            
            // Use the AI-generated explanation if available and meaningful
            const explanation = currentQuestion.value.explanation;
            if (explanation && 
                explanation.length > 20 && 
                !explanation.includes('The correct answer is') &&
                !explanation.includes('it accurately represents')) {
                return explanation;
            }
            
            // If we have a basic explanation, try to make it more informative
            if (explanation && explanation.includes('The correct answer is')) {
                // Extract any additional context from the explanation
                const parts = explanation.split('.');
                const additionalInfo = parts.slice(1).join('.').trim();
                if (additionalInfo.length > 10) {
                    return `The correct answer is ${getCorrectOption()}. ${additionalInfo}`;
                }
            }
            
            // Fallback to a simple but clear explanation
            const correctLetter = String.fromCharCode(65 + getCorrectIndex());
            const correctOption = getCorrectOption();
            
            return `The correct answer is ${correctLetter}. ${correctOption}. This information comes directly from your study materials.`;
        };

        const getOptionBadgeClass = (index) => {
            const correctIndex = getCorrectIndex();
            
            if (!store.state.showAnswer) {
                return selectedChoice.value === index 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600';
            }
            
            if (index === correctIndex) {
                return 'bg-green-500 text-white';
            } else if (selectedChoice.value === index) {
                return 'bg-red-500 text-white';
            }
            return 'bg-gray-100 text-gray-600';
        };

        return {
            store,
            currentQuestion,
            selectedChoice,
            lastAnswerCorrect,
            getCorrectIndex,
            getCorrectOption,
            getExplanationText,
            selectOption,
            checkAnswer,
            nextQuestion,
            skipQuestion,
            getDifficultyClass,
            getDifficultyEmoji,
            getOptionClass,
            getOptionBadgeClass
        };
    }
};