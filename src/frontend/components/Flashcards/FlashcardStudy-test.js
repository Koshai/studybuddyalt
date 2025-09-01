// Test version of FlashcardStudy component
window.FlashcardStudyTestComponent = {
    template: `
    <div class="animate-fade-in max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h1>FlashcardStudy Test Component</h1>
            <p>Selected Set: {{ selectedSet?.name || 'None' }}</p>
            <p>Current View: {{ currentView }}</p>
            <p>Cards Length: {{ cards.length }}</p>
            <p>Loading: {{ loading }}</p>
        </div>
    </div>
    `,
    
    setup() {
        const store = window.store;
        const loading = Vue.ref(true);
        const cards = Vue.ref([]);
        
        const selectedSet = Vue.computed(() => store.state.selectedFlashcardSet);
        const currentView = Vue.computed(() => store.state.currentView);
        
        Vue.onMounted(() => {
            console.log('🧪 FlashcardStudy TEST component mounted!');
            console.log('📊 Selected set:', selectedSet.value);
            console.log('📊 Store state:', store?.state?.currentView);
            loading.value = false;
        });
        
        return {
            selectedSet,
            currentView,
            loading,
            cards
        };
    }
};