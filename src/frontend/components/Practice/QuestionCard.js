// components/Practice/QuestionCard.js - CLEAN VERSION
window.QuestionCard = {
    template: `
    <div class="content-card p-8">
        <!-- Question Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {{ store.state.currentQuestionIndex + 1 }}
                </div>
                <div>
                    <h3 class="font-semibold text-gray-900">Question {{ store.state.currentQuestionIndex + 1 }} of {{ store.state.questions.length }}</h3>
                    <p class="text-sm text-gray-600">{{ store.state.selectedTopic?.name }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span :class="getDifficultyClass(currentQuestion?.difficulty)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ currentQuestion?.difficulty || 'medium' }}
                </span>
                <span :class="getTypeClass(currentQuestion?.type)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ getTypeLabel(currentQuestion?.type) }}
                </span>
                <div class="flex space-x-1">
                    <div v-for="i in store.state.questions.length" :key="i" 
                         :class="[
                             'w-3 h-3 rounded-full transition-colors',
                             i <= store.state.currentQuestionIndex + 1 ? 'bg-primary-500' : 'bg-gray-300'
                         ]">
                    </div>
                </div>
            </div>
        </div>

        <!-- Question Content -->
        <div class="mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <i class="fas fa-question text-white text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium text-blue-900 mb-2">Question:</h4>
                        <p class="text-lg text-blue-800 leading-relaxed">{{ currentQuestion?.question }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Answer Input -->
        <div class="mb-6">
            <!-- Multiple Choice Questions -->
            <div v-if="currentQuestion?.type === 'multiple_choice' && currentQuestion?.options" class="space-y-3">
                <label class="block text-sm font-medium text-gray-700 mb-3">Choose the best answer:</label>
                <div class="space-y-3">
                    <button
                        v-for="(option, index) in currentQuestion.options"
                        :key="index"
                        @click="selectMultipleChoice(index)"
                        :disabled="store.state.showAnswer"
                        :class="[
                            'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                            selectedChoice === index 
                                ? 'border-primary-500 bg-primary-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white',
                            store.state.showAnswer && getOptionResultClass(index)
                        ]"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span :class="[
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                    selectedChoice === index 
                                        ? 'bg-primary-500 text-white' 
                                        : 'bg-gray-100 text-gray-600',
                                    store.state.showAnswer && getOptionBadgeClass(index)
                                ]">
                                    {{ String.fromCharCode(65 + index) }}
                                </span>
                                <span class="flex-1">{{ option }}</span>
                            </div>
                            <div v-if="store.state.showAnswer" class="flex items-center">
                                <i v-if="index === getCorrectIndex()" class="fas fa-check text-green-600 text-lg"></i>
                                <i v-else-if="selectedChoice === index && index !== getCorrectIndex()" class="fas fa-times text-red-600 text-lg"></i>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Text Answer Questions -->
            <div v-else class="space-y-4">
                <label class="block text-sm font-medium text-gray-700 mb-3">Your Answer</label>
                <textarea
                    v-model="store.state.userAnswer"
                    :disabled="store.state.showAnswer"
                    class="form-input w-full px-4 py-3 rounded-lg resize-none focus:outline-none"
                    rows="4"
                    placeholder="Type your detailed answer here..."
                ></textarea>
                
                <!-- Writing Tips -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-lightbulb text-yellow-600 mt-1"></i>
                        <div class="text-sm text-yellow-800">
                            <strong>Tip:</strong> Provide a detailed explanation with specific examples and reasoning.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4 mb-6">
            <button
                v-if="!store.state.showAnswer"
                @click="checkAnswer"
                :disabled="!canSubmitAnswer"
                class="btn-gradient text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <i class="fas fa-check mr-2"></i>
                Check Answer
            </button>
            
            <button
                v-else
                @click="nextQuestion"
                class="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-arrow-right mr-2"></i>
                {{ store.state.currentQuestionIndex < store.state.questions.length - 1 ? 'Next Question' : 'Finish Practice' }}
            </button>

            <button
                v-if="!store.state.showAnswer"
                @click="skipQuestion"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-forward mr-2"></i>
                Skip Question
            </button>
        </div>

        <!-- Answer Feedback -->
        <div v-if="store.state.showAnswer" class="space-y-4">
            <!-- Result Badge -->
            <div class="flex items-center justify-center mb-4">
                <div :class="[
                    'px-6 py-3 rounded-full font-bold text-lg flex items-center space-x-2',
                    lastAnswerCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]">
                    <i :class="lastAnswerCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                    <span>{{ lastAnswerCorrect ? 'Correct!' : 'Incorrect' }}</span>
                    <span v-if="answerAnalysis?.score !== undefined" class="text-sm opacity-75">
                        ({{ answerAnalysis.score }}%)
                    </span>
                </div>
            </div>

            <!-- Correct Answer -->
            <div class="bg-green-50 border border-green-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-lightbulb text-white text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-green-900">Correct Answer</h4>
                </div>
                
                <!-- For MCQ, show the correct option -->
                <div v-if="currentQuestion?.type === 'multiple_choice'">
                    <p class="text-green-800 leading-relaxed mb-3">
                        <strong>{{ String.fromCharCode(65 + getCorrectIndex()) }}. {{ getCorrectOption() }}</strong>
                    </p>
                    <p class="text-green-700 text-sm">{{ currentQuestion?.answer || 'No explanation provided.' }}</p>
                </div>
                
                <!-- For text questions, show the answer -->
                <div v-else>
                    <p class="text-green-800 leading-relaxed">{{ currentQuestion?.answer }}</p>
                </div>
                
                <!-- Show explanation if available and different from answer -->
                <div v-if="currentQuestion?.explanation && currentQuestion?.explanation !== currentQuestion?.answer" class="mt-4 pt-4 border-t border-green-200">
                    <h5 class="font-medium text-green-900 mb-2">Explanation:</h5>
                    <p class="text-green-700 text-sm">{{ currentQuestion.explanation }}</p>
                </div>
            </div>

            <!-- MCQ Explanation of Wrong Answers -->
            <div v-if="currentQuestion?.type === 'multiple_choice' && selectedChoice !== getCorrectIndex()" class="bg-red-50 border border-red-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-info-circle text-white text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-red-900">Why Your Answer Was Incorrect</h4>
                </div>
                <p class="text-red-800">
                    You selected: <strong>{{ String.fromCharCode(65 + selectedChoice) }}. {{ currentQuestion.options[selectedChoice] }}</strong>
                </p>
                <p class="text-red-700 mt-2 text-sm">
                    The correct answer is <strong>{{ String.fromCharCode(65 + getCorrectIndex()) }}. {{ getCorrectOption() }}</strong> 
                    because {{ getExplanationText() }}
                </p>
            </div>

            <!-- Answer Analysis (for text answers) -->
            <div v-if="currentQuestion?.type !== 'multiple_choice' && answerAnalysis" class="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-chart-line text-white text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-blue-900">Answer Analysis</h4>
                </div>
                <div class="space-y-2">
                    <p class="text-blue-800"><strong>Similarity Score:</strong> {{ answerAnalysis.score }}%</p>
                    <p class="text-blue-800"><strong>Feedback:</strong> {{ answerAnalysis.feedback }}</p>
                    <div v-if="answerAnalysis.keywordMatches && answerAnalysis.keywordMatches.length > 0" class="text-blue-800">
                        <strong>Key concepts mentioned:</strong>
                        <span v-for="keyword in answerAnalysis.keywordMatches" :key="keyword" 
                              class="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs ml-1">
                            {{ keyword }}
                        </span>
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
        const answerAnalysis = Vue.ref(null);

        const currentQuestion = Vue.computed(() => {
            return store.currentQuestion;
        });

        const canSubmitAnswer = Vue.computed(() => {
            if (currentQuestion.value?.type === 'multiple_choice') {
                return selectedChoice.value !== null;
            } else {
                return store.state.userAnswer && store.state.userAnswer.trim().length > 0;
            }
        });

        // Helper functions for MCQ handling
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

        const getExplanationText = () => {
            if (currentQuestion.value?.explanation && 
                currentQuestion.value.explanation !== currentQuestion.value.answer) {
                return currentQuestion.value.explanation;
            }
            
            if (currentQuestion.value?.answer) {
                return currentQuestion.value.answer;
            }
            
            return 'it provides the accurate information requested in the question.';
        };

        const selectMultipleChoice = (index) => {
            if (!store.state.showAnswer) {
                selectedChoice.value = index;
            }
        };

        const checkAnswer = async () => {
            let isCorrect = false;

            if (currentQuestion.value?.type === 'multiple_choice') {
                const correctIndex = getCorrectIndex();
                isCorrect = selectedChoice.value === correctIndex;
            } else {
                // Advanced text answer checking
                const analysis = await analyzeTextAnswer(
                    store.state.userAnswer,
                    currentQuestion.value?.answer || ''
                );
                answerAnalysis.value = analysis;
                isCorrect = analysis.score >= 70; // 70% similarity threshold
            }

            lastAnswerCorrect.value = isCorrect;
            store.submitAnswer(isCorrect);
        };

        const analyzeTextAnswer = async (userAnswer, correctAnswer) => {
            const userWords = userAnswer.toLowerCase().split(/\s+/);
            const correctWords = correctAnswer.toLowerCase().split(/\s+/);
            
            // Find keyword matches
            const keywordMatches = userWords.filter(word => 
                word.length > 3 && correctWords.includes(word)
            );

            // Calculate similarity score
            const score = Math.min(100, Math.max(0, (keywordMatches.length / Math.max(correctWords.length * 0.5, 1)) * 100));

            // Generate feedback
            let feedback = '';
            if (score >= 90) {
                feedback = 'Excellent! Your answer covers all key points comprehensively.';
            } else if (score >= 70) {
                feedback = 'Good answer! You mentioned most important concepts.';
            } else if (score >= 50) {
                feedback = 'Partially correct. You got some key points but missed others.';
            } else if (score >= 30) {
                feedback = 'Your answer shows some understanding but needs significant improvement.';
            } else {
                feedback = 'Your answer needs major improvement. Please review the correct answer carefully.';
            }

            return { score: Math.round(score), feedback, keywordMatches };
        };

        const nextQuestion = () => {
            // Reset state for next question
            selectedChoice.value = null;
            answerAnalysis.value = null;
            store.nextQuestion();
        };

        const skipQuestion = () => {
            store.submitAnswer(false); // Mark as incorrect
            lastAnswerCorrect.value = false;
        };

        const getDifficultyClass = (difficulty) => {
            const classes = {
                'easy': 'bg-green-100 text-green-700',
                'medium': 'bg-yellow-100 text-yellow-700',
                'hard': 'bg-red-100 text-red-700'
            };
            return classes[difficulty] || classes.medium;
        };

        const getTypeClass = (type) => {
            const classes = {
                'multiple_choice': 'bg-blue-100 text-blue-700',
                'text': 'bg-purple-100 text-purple-700'
            };
            return classes[type] || classes.text;
        };

        const getTypeLabel = (type) => {
            const labels = {
                'multiple_choice': 'MCQ',
                'text': 'Text'
            };
            return labels[type] || 'Text';
        };

        const getOptionResultClass = (index) => {
            const correctIndex = getCorrectIndex();
            
            if (index === correctIndex) {
                return 'border-green-500 bg-green-50';
            } else if (selectedChoice.value === index) {
                return 'border-red-500 bg-red-50';
            }
            return 'border-gray-200 bg-gray-50';
        };

        const getOptionBadgeClass = (index) => {
            const correctIndex = getCorrectIndex();
            
            if (index === correctIndex) {
                return 'bg-green-500 text-white';
            } else if (selectedChoice.value === index) {
                return 'bg-red-500 text-white';
            }
            return selectedChoice.value === index ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600';
        };

        return {
            store,
            currentQuestion,
            selectedChoice,
            lastAnswerCorrect,
            answerAnalysis,
            canSubmitAnswer,
            getCorrectIndex,
            getCorrectOption,
            getExplanationText,
            selectMultipleChoice,
            checkAnswer,
            nextQuestion,
            skipQuestion,
            getDifficultyClass,
            getTypeClass,
            getTypeLabel,
            getOptionResultClass,
            getOptionBadgeClass
        };
    }
};