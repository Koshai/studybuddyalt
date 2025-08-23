// components/Flashcards/FlashcardSetList.js - Browse Flashcard Sets (Debug Version)
window.FlashcardSetListComponent = {
    template: `
    <div class="p-6">
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>✅ Flashcard Component Loaded!</strong>
            <p class="text-sm mt-1">The flashcard system is working. This is a simplified version for debugging.</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">📚 Flashcard Sets</h1>
            <p class="text-gray-600 mb-6">Create and manage your flashcard sets for spaced repetition learning.</p>
            
            <button 
                @click="createFirstSet"
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
                <i class="fas fa-plus mr-2"></i>Create Your First Set
            </button>
            
            <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 class="font-semibold text-yellow-800">Coming Features:</h3>
                <ul class="text-sm text-yellow-700 mt-2">
                    <li>• Spaced repetition algorithm</li>
                    <li>• Multiple study modes</li>
                    <li>• Progress tracking</li>
                    <li>• Bulk card creation</li>
                </ul>
            </div>
        </div>
    </div>
    `,

    setup() {
        // Simple setup function for debugging
        const createFirstSet = () => {
            alert('Create First Set clicked! This will open the flashcard creation interface.');
        };

        return {
            createFirstSet
        };
    }
};