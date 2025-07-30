window.UsageIndicatorComponent = {
  template: `
    <div class="bg-white rounded-lg p-4 border">
      <h4 class="font-medium text-gray-900 mb-3">Usage This Month</h4>
      
      <!-- Questions Usage -->
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span>Questions Generated</span>
          <span>{{ store.state.usage.questions.used }}/{{ store.state.usage.questions.limit }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-primary-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: questionsPercentage + '%' }"
          ></div>
        </div>
      </div>
      
      <!-- Storage Usage -->
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span>Storage Used</span>
          <span>{{ formatBytes(store.state.usage.storage.used) }}/{{ formatBytes(store.state.usage.storage.limit) }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-green-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: storagePercentage + '%' }"
          ></div>
        </div>
      </div>
      
      <!-- Upgrade CTA for Free Users -->
      <div v-if="store.state.subscriptionTier === 'free'" class="mt-4 p-3 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800 mb-2">Want more questions and storage?</p>
        <button 
          @click="$emit('upgrade-clicked')"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  `,
  
  setup(props, { emit }) {
    const store = window.store;

    const questionsPercentage = Vue.computed(() => {
      const usage = store.state.usage.questions;
      return Math.min((usage.used / usage.limit) * 100, 100);
    });

    const storagePercentage = Vue.computed(() => {
      const usage = store.state.usage.storage;
      return Math.min((usage.used / usage.limit) * 100, 100);
    });

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      store,
      questionsPercentage,
      storagePercentage,
      formatBytes
    };
  }
};