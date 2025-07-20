// src/frontend/components/Practice/QuestionCard.js
window.QuestionCard = {
    template: `
    <div class="content-card p-8">
        <!-- Question Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {{ store.state.currentQuestionIndex + 1 }}
                </div>
                <div>
                    <h3 class="font-semibold text-gray-900">Question {{ store.state.currentQuestionIndex + 1 }}</h3>
                    <p class="text-sm text-gray-600">{{ store.state.selectedTopic?.name }}</p>
                </div>
            </div>
            <div class="flex space-x-1">
                <div v-for="i in store.state.questions.length" :key="i" 
                     :class="[
                         'w-2 h-2 rounded-full transition-colors',
                         i <= store.state.currentQuestionIndex + 1 ? 'bg-primary-500' : 'bg-gray-300'
                     ]">
                </div>
            </div>
        </div>

        <!-- Question Content -->
        <div class="mb-8">
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p class="text-lg text-gray-900 leading-relaxed">{{ store.currentQuestion?.question }}</p>
            </div>
        </div>

        <!-- Answer Input -->
        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">Your Answer</label>
            <textarea
                v-model="store.state.userAnswer"
                :disabled="store.state.showAnswer"
                class="form-input w-full px-4 py-3 rounded-lg resize-none focus:outline-none"
                rows="4"
                placeholder="Type your answer here..."
            ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4 mb-6">
            <button
                v-if="!store.state.showAnswer"
                @click="checkAnswer"
                :disabled="!store.state.userAnswer.trim()"
                class="btn-gradient text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
                <i class="fas fa-check mr-2"></i>
                Check Answer
            </button>
            
            <button
                v-else
                @click="store.nextQuestion()"
                class="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-arrow-right mr-2"></i>
                {{ store.state.currentQuestionIndex < store.state.questions.length - 1 ? 'Next Question' : 'Finish Practice' }}
            </button>
        </div>

        <!-- Correct Answer -->
        <div v-if="store.state.showAnswer" class="bg-blue-50 border border-blue-200 rounded-xl p-6 animate-slide-up">
            <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <i class="fas fa-lightbulb text-white text-sm"></i>
                </div>
                <h4 class="font-semibold text-blue-900">Correct Answer</h4>
            </div>
            <p class="text-blue-800 leading-relaxed">{{ store.currentQuestion?.answer }}</p>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;

        const checkAnswer = () => {
            // Simple answer checking - you could enhance this with AI evaluation
            const userAnswer = store.state.userAnswer.toLowerCase().trim();
            const correctAnswer = store.currentQuestion?.answer.toLowerCase() || '';
            
            // Basic keyword matching
            const isCorrect = userAnswer.length > 10 && 
                correctAnswer.split(' ').some(word => 
                    word.length > 3 && userAnswer.includes(word.toLowerCase())
                );

            store.submitAnswer(isCorrect);
        };

        return {
            store,
            checkAnswer
        };
    }
};