window.LoginFormComponent = {
  template: `
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h2 class="text-2xl font-bold text-center mb-6">Sign In to StudyAI</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        
        <div class="mb-6">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
        >
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
      
      <p class="text-center mt-4">
        Don't have an account? 
        <button @click="$emit('switch-to-register')" class="text-primary-500 hover:underline">
          Sign up
        </button>
      </p>
    </div>
  `,
  
  setup(props, { emit }) {
    const store = window.store;
    const email = Vue.ref('');
    const password = Vue.ref('');
    const isLoading = Vue.ref(false);

    const handleLogin = async () => {
      isLoading.value = true;
      try {
        await store.login(email.value, password.value);
        emit('login-success');
      } catch (error) {
        // Error handling done in store
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      password,
      isLoading,
      handleLogin
    };
  }
};