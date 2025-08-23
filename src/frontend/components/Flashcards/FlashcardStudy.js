// components/Flashcards/FlashcardStudy.js - Flashcard Study Interface
window.FlashcardStudyComponent = {
    template: `
    <div class="animate-fade-in max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ selectedSet?.name || 'Study Session' }}</h1>
                    <p class="text-gray-600">{{ selectedSet?.description || 'Practice with spaced repetition' }}</p>
                </div>
                <button 
                    @click="exitStudy"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <i class="fas fa-times mr-2"></i>Exit Study
                </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                    class="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                    :style="{ width: progressPercentage + '%' }"
                ></div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span>Card {{ currentCardIndex + 1 }} of {{ totalCards }}</span>
                <span>{{ Math.round(progressPercentage) }}% Complete</span>
                <span>Score: {{ correctAnswers }}/{{ answeredCards }} ({{ scorePercentage }}%)</span>
            </div>
        </div>

        <!-- Study Mode Selection -->
        <div v-if="!studyStarted && cards.length > 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Choose Your Study Mode</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="mode in studyModes" :key="mode.id"
                     @click="startStudy(mode)"
                     class="group cursor-pointer p-6 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                    <div class="flex items-center mb-3">
                        <div class="text-2xl mr-3">{{ mode.icon }}</div>
                        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary-600">{{ mode.name }}</h3>
                    </div>
                    <p class="text-gray-600 text-sm">{{ mode.description }}</p>
                    <div class="mt-3 text-xs text-primary-600 font-medium">{{ mode.details }}</div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Loading Cards...</h3>
            <p class="text-gray-600">Preparing your study session</p>
        </div>

        <!-- No Cards Available -->
        <div v-else-if="cards.length === 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-cards-blank text-orange-500 text-3xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Cards to Study</h3>
            <p class="text-gray-600 mb-6">This flashcard set is empty or all cards are up to date.</p>
            <div class="flex gap-3 justify-center">
                <button 
                    @click="goToCreateCards"
                    class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <i class="fas fa-plus mr-2"></i>Add Cards
                </button>
                <button 
                    @click="exitStudy"
                    class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <i class="fas fa-arrow-left mr-2"></i>Back to Sets
                </button>
            </div>
        </div>

        <!-- Study Complete -->
        <div v-else-if="studyComplete" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div class="text-center mb-8">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                     :class="finalScore >= 80 ? 'bg-green-100' : finalScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'">
                    <i class="text-3xl"
                       :class="finalScore >= 80 ? 'fas fa-trophy text-green-600' : finalScore >= 60 ? 'fas fa-medal text-yellow-600' : 'fas fa-thumbs-up text-red-600'"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Study Session Complete!</h2>
                <p class="text-gray-600">Great job working through your flashcards</p>
            </div>

            <!-- Results -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ correctAnswers }}/{{ totalCards }}</div>
                    <div class="text-sm text-gray-600">Correct</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ finalScore }}%</div>
                    <div class="text-sm text-gray-600">Score</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ Math.round(averageTime) }}s</div>
                    <div class="text-sm text-gray-600">Avg Time</div>
                </div>
                <div class="text-center p-4 bg-indigo-50 rounded-lg">
                    <div class="text-2xl font-bold text-indigo-600">{{ currentStreak }}</div>
                    <div class="text-sm text-gray-600">Best Streak</div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                    @click="restartStudy"
                    class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <i class="fas fa-redo mr-2"></i>Study Again
                </button>
                <button 
                    @click="studyDifferentMode"
                    class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    <i class="fas fa-random mr-2"></i>Try Different Mode
                </button>
                <button 
                    @click="exitStudy"
                    class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <i class="fas fa-arrow-left mr-2"></i>Back to Sets
                </button>
            </div>
        </div>

        <!-- Active Study Card -->
        <div v-else-if="studyStarted && currentCard" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <!-- Study Mode Info -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                    <span class="text-2xl mr-2">{{ currentStudyMode.icon }}</span>
                    <span class="text-sm font-medium text-gray-600">{{ currentStudyMode.name }}</span>
                </div>
                <div class="text-sm text-gray-500">
                    {{ formatTime(cardTime) }}
                </div>
            </div>

            <!-- Flashcard -->
            <div class="mb-8">
                <div 
                    @click="flipCard"
                    class="relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-2xl p-8 min-h-[300px] cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                    <!-- Front Side -->
                    <div v-if="!cardFlipped" class="flex flex-col items-center justify-center h-full text-center">
                        <div class="text-lg font-medium text-gray-900 mb-4">{{ currentCard.front }}</div>
                        <div v-if="currentCard.hint && showHint" class="text-sm text-blue-600 italic mb-4">
                            💡 Hint: {{ currentCard.hint }}
                        </div>
                        <div class="text-sm text-gray-500">Click to reveal answer</div>
                    </div>
                    
                    <!-- Back Side -->
                    <div v-else class="flex flex-col items-center justify-center h-full text-center">
                        <div class="text-lg font-medium text-gray-900 mb-4">{{ currentCard.back }}</div>
                        <div class="text-sm text-gray-500">How well did you know this?</div>
                    </div>

                    <!-- Flip Icon -->
                    <div class="absolute top-4 right-4 text-blue-400">
                        <i class="fas fa-sync-alt" :class="{ 'animate-spin': cardFlipped }"></i>
                    </div>
                </div>
            </div>

            <!-- Answer Buttons (shown after flip) -->
            <div v-if="cardFlipped" class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <button 
                    @click="answerCard(1)"
                    class="p-4 border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-300"
                >
                    <div class="font-semibold">Again</div>
                    <div class="text-xs">Didn't know</div>
                </button>
                <button 
                    @click="answerCard(2)"
                    class="p-4 border-2 border-yellow-300 text-yellow-700 rounded-xl hover:bg-yellow-50 hover:border-yellow-400 transition-all duration-300"
                >
                    <div class="font-semibold">Hard</div>
                    <div class="text-xs">Barely knew</div>
                </button>
                <button 
                    @click="answerCard(3)"
                    class="p-4 border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all duration-300"
                >
                    <div class="font-semibold">Good</div>
                    <div class="text-xs">Knew it</div>
                </button>
                <button 
                    @click="answerCard(4)"
                    class="p-4 border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                >
                    <div class="font-semibold">Easy</div>
                    <div class="text-xs">Very easy</div>
                </button>
            </div>

            <!-- Hint Button (before flip) -->
            <div v-if="!cardFlipped && currentCard.hint" class="text-center mb-6">
                <button 
                    @click="toggleHint"
                    class="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <i class="fas fa-lightbulb mr-2"></i>{{ showHint ? 'Hide Hint' : 'Show Hint' }}
                </button>
            </div>

            <!-- Navigation -->
            <div class="flex items-center justify-between">
                <button
                    @click="previousCard"
                    :disabled="currentCardIndex === 0"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <i class="fas fa-arrow-left mr-2"></i>Previous
                </button>

                <div class="text-sm text-gray-500">
                    Card {{ currentCardIndex + 1 }} of {{ totalCards }}
                </div>

                <button
                    v-if="currentCardIndex < totalCards - 1"
                    @click="skipCard"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                    Skip<i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // State
        const loading = Vue.ref(true);
        const cards = Vue.ref([]);
        const studyStarted = Vue.ref(false);
        const studyComplete = Vue.ref(false);
        const currentCardIndex = Vue.ref(0);
        const cardFlipped = Vue.ref(false);
        const showHint = Vue.ref(false);
        const cardStartTime = Vue.ref(Date.now());
        const cardTime = Vue.ref(0);
        const timer = Vue.ref(null);
        const answers = Vue.ref([]);
        const currentStreak = Vue.ref(0);
        const maxStreak = Vue.ref(0);
        const currentStudyMode = Vue.ref(null);

        // Study modes
        const studyModes = Vue.ref([
            {
                id: 'spaced_review',
                name: 'Spaced Review',
                icon: '🧠',
                description: 'Study cards based on spaced repetition algorithm',
                details: 'Focus on cards due for review'
            },
            {
                id: 'recognition',
                name: 'Recognition',
                icon: '👁️',
                description: 'See the question, recall the answer',
                details: 'Classic flashcard study mode'
            },
            {
                id: 'recall',
                name: 'Recall',
                icon: '💭',
                description: 'Type your answers for better retention',
                details: 'Active recall practice'
            },
            {
                id: 'rapid_fire',
                name: 'Rapid Fire',
                icon: '⚡',
                description: 'Quick review of all cards',
                details: 'Fast-paced review session'
            }
        ]);

        // Computed
        const selectedSet = Vue.computed(() => store.state.selectedFlashcardSet);
        const currentCard = Vue.computed(() => cards.value[currentCardIndex.value]);
        const totalCards = Vue.computed(() => cards.value.length);
        const progressPercentage = Vue.computed(() => 
            totalCards.value > 0 ? ((currentCardIndex.value + (cardFlipped.value ? 0.5 : 0)) / totalCards.value) * 100 : 0
        );
        const correctAnswers = Vue.computed(() => answers.value.filter(a => a.quality >= 3).length);
        const answeredCards = Vue.computed(() => answers.value.length);
        const scorePercentage = Vue.computed(() => 
            answeredCards.value > 0 ? Math.round((correctAnswers.value / answeredCards.value) * 100) : 0
        );
        const finalScore = Vue.computed(() => 
            totalCards.value > 0 ? Math.round((correctAnswers.value / totalCards.value) * 100) : 0
        );
        const averageTime = Vue.computed(() => {
            const times = answers.value.map(a => a.responseTime);
            return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        });

        // Load cards for study
        const loadCards = async () => {
            if (!selectedSet.value) {
                store.showNotification('No flashcard set selected', 'error');
                store.setCurrentView('flashcards');
                return;
            }

            try {
                loading.value = true;
                console.log('📚 Loading cards for study session:', selectedSet.value.name);
                
                // Load cards due for review (or all cards if none due)
                const reviewResponse = await window.api.get(\`/api/flashcards/review?setId=\${selectedSet.value.id}&limit=50\`);
                let reviewCards = reviewResponse.data || [];
                
                if (reviewCards.length === 0) {
                    // No cards due for review, load all cards from the set
                    const allCardsResponse = await window.api.get(\`/api/flashcards/sets/\${selectedSet.value.id}/cards\`);
                    reviewCards = allCardsResponse.data || [];
                }
                
                // Shuffle cards for variety
                cards.value = reviewCards.sort(() => Math.random() - 0.5);
                
                console.log(\`✅ Loaded \${cards.value.length} cards for study\`);
            } catch (error) {
                console.error('❌ Error loading cards:', error);
                store.showNotification('Failed to load cards for study', 'error');
            } finally {
                loading.value = false;
            }
        };

        // Start study session
        const startStudy = (mode) => {
            currentStudyMode.value = mode;
            studyStarted.value = true;
            currentCardIndex.value = 0;
            cardFlipped.value = false;
            showHint.value = false;
            answers.value = [];
            currentStreak.value = 0;
            maxStreak.value = 0;
            startCardTimer();
        };

        // Timer functions
        const startCardTimer = () => {
            cardStartTime.value = Date.now();
            cardTime.value = 0;
            timer.value = setInterval(() => {
                cardTime.value = Math.floor((Date.now() - cardStartTime.value) / 1000);
            }, 1000);
        };

        const stopCardTimer = () => {
            if (timer.value) {
                clearInterval(timer.value);
                timer.value = null;
            }
            return Math.floor((Date.now() - cardStartTime.value) / 1000) * 1000; // Return milliseconds
        };

        // Card interactions
        const flipCard = () => {
            if (!cardFlipped.value) {
                cardFlipped.value = true;
            }
        };

        const toggleHint = () => {
            showHint.value = !showHint.value;
        };

        const answerCard = async (quality) => {
            const responseTime = stopCardTimer();
            const isCorrect = quality >= 3;
            
            // Update streak
            if (isCorrect) {
                currentStreak.value++;
                maxStreak.value = Math.max(maxStreak.value, currentStreak.value);
            } else {
                currentStreak.value = 0;
            }

            // Record answer
            answers.value.push({
                cardId: currentCard.value.id,
                quality: quality,
                responseTime: responseTime,
                isCorrect: isCorrect
            });

            try {
                // Update progress on backend
                await window.api.post(\`/api/flashcards/cards/\${currentCard.value.id}/answer\`, {
                    isCorrect: isCorrect,
                    responseTime: responseTime
                });
            } catch (error) {
                console.warn('❌ Failed to record answer progress:', error);
            }

            // Move to next card
            setTimeout(() => {
                nextCard();
            }, 500);
        };

        const nextCard = () => {
            if (currentCardIndex.value >= totalCards.value - 1) {
                completeStudy();
            } else {
                currentCardIndex.value++;
                cardFlipped.value = false;
                showHint.value = false;
                startCardTimer();
            }
        };

        const previousCard = () => {
            if (currentCardIndex.value > 0) {
                currentCardIndex.value--;
                cardFlipped.value = false;
                showHint.value = false;
                startCardTimer();
            }
        };

        const skipCard = () => {
            nextCard();
        };

        const completeStudy = async () => {
            stopCardTimer();
            studyComplete.value = true;
            
            try {
                // Record study session
                const sessionData = {
                    setId: selectedSet.value.id,
                    studyMode: currentStudyMode.value.id,
                    cardsStudied: totalCards.value,
                    cardsCorrect: correctAnswers.value,
                    durationSeconds: Math.floor((Date.now() - cardStartTime.value) / 1000)
                };
                
                await window.api.post('/flashcards/sessions', sessionData);
                console.log('✅ Study session recorded');
            } catch (error) {
                console.warn('❌ Failed to record study session:', error);
            }
        };

        // Navigation
        const restartStudy = () => {
            studyComplete.value = false;
            startStudy(currentStudyMode.value);
        };

        const studyDifferentMode = () => {
            studyComplete.value = false;
            studyStarted.value = false;
        };

        const exitStudy = () => {
            stopCardTimer();
            store.setCurrentView('flashcards');
        };

        const goToCreateCards = () => {
            store.setCurrentView('flashcards-create');
        };

        // Utility functions
        const formatTime = (seconds) => {
            if (seconds < 60) return \`\${seconds}s\`;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return \`\${minutes}m \${remainingSeconds}s\`;
        };

        // Lifecycle
        Vue.onMounted(() => {
            loadCards();
        });

        Vue.onUnmounted(() => {
            stopCardTimer();
        });

        return {
            // State
            loading,
            cards,
            studyStarted,
            studyComplete,
            currentCardIndex,
            cardFlipped,
            showHint,
            cardTime,
            currentStreak,
            studyModes,
            currentStudyMode,
            
            // Computed
            selectedSet,
            currentCard,
            totalCards,
            progressPercentage,
            correctAnswers,
            answeredCards,
            scorePercentage,
            finalScore,
            averageTime,
            
            // Methods
            startStudy,
            flipCard,
            toggleHint,
            answerCard,
            nextCard,
            previousCard,
            skipCard,
            restartStudy,
            studyDifferentMode,
            exitStudy,
            goToCreateCards,
            formatTime
        };
    }
};