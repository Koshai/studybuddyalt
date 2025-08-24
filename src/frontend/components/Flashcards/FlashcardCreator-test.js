// Test FlashcardCreator Component - Minimal Debug Version
console.log('🔧 Loading FlashcardCreator-test.js');

window.FlashcardCreatorTestComponent = {
    template: `
    <div class="p-6">
        <h1 class="text-2xl font-bold text-red-600">🔧 FLASHCARD CREATOR TEST COMPONENT</h1>
        <p>This is a test component to debug why FlashcardCreator isn't mounting.</p>
        <div class="mt-4 p-4 bg-yellow-100 border">
            <p><strong>Selected Set:</strong> {{ selectedSet?.name || 'None' }}</p>
            <p><strong>Store exists:</strong> {{ !!store }}</p>
            <p><strong>Current View:</strong> {{ store?.state?.currentView }}</p>
        </div>
    </div>
    `,

    setup() {
        console.log('🔧 FlashcardCreatorTest setup() called');
        const store = window.store;
        
        const selectedSet = Vue.computed(() => {
            const set = store?.state?.selectedFlashcardSet;
            console.log('🔧 selectedSet computed:', set);
            return set;
        });

        Vue.onMounted(() => {
            console.log('🔧 FlashcardCreatorTest mounted successfully');
        });

        return {
            store,
            selectedSet
        };
    }
};

console.log('🔧 FlashcardCreatorTestComponent defined:', !!window.FlashcardCreatorTestComponent);