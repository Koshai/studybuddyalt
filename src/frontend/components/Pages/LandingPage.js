// components/Pages/LandingPage.js - Marketing Landing Page
window.LandingPageComponent = {
    template: `
    <div>
        <!-- Hero Section -->
        <section class="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 30px 30px;"></div>
            </div>
            
            <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div class="text-center">
                    <!-- Logo and Brand -->
                    <div class="flex items-center justify-center mb-8">
                        <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
                            <i class="fas fa-brain text-white text-3xl"></i>
                        </div>
                        <h1 class="text-6xl md:text-8xl font-black text-white">
                            Jaquizy
                        </h1>
                    </div>
                    
                    <!-- Main Headline -->
                    <h2 class="text-3xl md:text-5xl font-bold mb-6 leading-tight text-blue-100">
                        Turn Your Notes Into
                        <span class="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                            Smart Quiz Questions
                        </span>
                    </h2>
                    
                    <!-- Subheadline -->
                    <p class="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Upload your study materials, let AI generate personalized quiz questions, and practice smarter. 
                        Transform passive studying into active learning in seconds.
                    </p>
                    
                    <!-- CTA Buttons -->
                    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <button 
                            @click="showAuth('register')"
                            class="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                            <i class="fas fa-rocket mr-2"></i>
                            Start Learning Free
                        </button>
                        <button 
                            @click="scrollToDemo"
                            class="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
                        >
                            <i class="fas fa-play mr-2"></i>
                            Watch Demo
                        </button>
                    </div>
                    
                    <!-- Trust Indicators -->
                    <div class="flex flex-wrap justify-center items-center gap-8 text-blue-200 text-sm">
                        <div class="flex items-center">
                            <i class="fas fa-check-circle mr-2"></i>
                            Free to start
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt mr-2"></i>
                            Your data stays private
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-clock mr-2"></i>
                            Setup in 30 seconds
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- How It Works Section -->
        <section class="py-20 bg-gray-50" id="demo">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        From Notes to Mastery in 3 Simple Steps
                    </h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        Stop spending hours creating flashcards manually. Let AI do the heavy lifting while you focus on learning.
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8 mb-16">
                    <!-- Step 1 -->
                    <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-upload text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">1. Upload Your Materials</h3>
                        <p class="text-gray-600 mb-4">
                            Drop in PDFs, images, or type your notes directly. Our OCR technology extracts text from any document automatically.
                        </p>
                        <div class="text-sm text-blue-600 font-medium">
                            <i class="fas fa-file-pdf mr-2"></i>PDFs, Images, Text - Any format works
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-magic text-purple-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">2. AI Generates Questions</h3>
                        <p class="text-gray-600 mb-4">
                            Our AI reads your content and creates personalized multiple-choice questions that test your understanding, not just memorization.
                        </p>
                        <div class="text-sm text-purple-600 font-medium">
                            <i class="fas fa-brain mr-2"></i>Powered by advanced AI models
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-chart-line text-green-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">3. Practice & Improve</h3>
                        <p class="text-gray-600 mb-4">
                            Take practice sessions, get instant feedback, and track your progress. See exactly where you need more study time.
                        </p>
                        <div class="text-sm text-green-600 font-medium">
                            <i class="fas fa-trophy mr-2"></i>Track progress and improve scores
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Everything You Need to Study Smarter
                    </h2>
                    <p class="text-xl text-gray-600">
                        Jaquizy isn't just a quiz maker - it's your complete AI study companion
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Rich Text Editing -->
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-edit text-blue-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">Rich Text Editor</h4>
                            <p class="text-gray-600 text-sm">Edit and improve your extracted content with our professional editor</p>
                        </div>
                    </div>

                    <!-- Progress Tracking -->
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-chart-bar text-green-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">Progress Analytics</h4>
                            <p class="text-gray-600 text-sm">Detailed insights into your learning progress and weak areas</p>
                        </div>
                    </div>

                    <!-- Offline Mode -->
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-wifi-slash text-purple-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">Works Offline</h4>
                            <p class="text-gray-600 text-sm">Study anywhere, even without an internet connection</p>
                        </div>
                    </div>

                    <!-- Smart Organization -->
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-folder-tree text-orange-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">Smart Organization</h4>
                            <p class="text-gray-600 text-sm">Organize by subjects and topics for easy content management</p>
                        </div>
                    </div>

                    <!-- Multiple Question Types -->
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-list-check text-red-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">Multiple Question Types</h4>
                            <p class="text-gray-600 text-sm">MCQ, flashcards, and more question formats coming soon</p>
                        </div>
                    </div>

                    <!-- Secure & Private -->
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-lock text-gray-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">Secure & Private</h4>
                            <p class="text-gray-600 text-sm">Your study materials stay private and secure</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section class="py-20 bg-gray-50">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Simple, Fair Pricing
                    </h2>
                    <p class="text-xl text-gray-600">
                        Start free, upgrade when you need more power
                    </p>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Free Tier -->
                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="text-center">
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                            <div class="text-4xl font-bold text-gray-900 mb-4">$0<span class="text-lg font-normal text-gray-600">/month</span></div>
                            <p class="text-gray-600 mb-6">Perfect for trying out Jaquizy</p>
                        </div>
                        
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span>50 AI-generated questions/month</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span>3 topics</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span>Rich text editing</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-3"></i>
                                <span>Basic progress tracking</span>
                            </li>
                        </ul>
                        
                        <button 
                            @click="showAuth('register')"
                            class="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                        >
                            Start Free
                        </button>
                    </div>

                    <!-- Pro Tier -->
                    <div class="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-8 shadow-xl relative">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <span class="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
                        </div>
                        
                        <div class="text-center">
                            <h3 class="text-2xl font-bold mb-2">Pro</h3>
                            <div class="text-4xl font-bold mb-4">$19.99<span class="text-lg font-normal opacity-80">/month</span></div>
                            <p class="opacity-90 mb-6">For serious students and professionals</p>
                        </div>
                        
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-300 mr-3"></i>
                                <span>Unlimited questions</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-300 mr-3"></i>
                                <span>Unlimited topics</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-300 mr-3"></i>
                                <span>Ad-free experience</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-300 mr-3"></i>
                                <span>Advanced analytics</span>
                            </li>
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-300 mr-3"></i>
                                <span>Priority support</span>
                            </li>
                        </ul>
                        
                        <button 
                            disabled
                            class="w-full bg-gray-200 text-gray-500 py-3 px-6 rounded-xl font-semibold cursor-not-allowed transition-colors"
                        >
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Social Proof / Testimonials -->
        <section class="py-20 bg-white">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Join Thousands of Successful Students
                    </h2>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-gray-50 rounded-2xl p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user text-blue-600"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900">Sarah M.</div>
                                <div class="text-sm text-gray-600">Pre-Med Student</div>
                            </div>
                        </div>
                        <p class="text-gray-700 italic">"Jaquizy helped me ace my biochemistry exam. The AI questions were spot-on and much better than making flashcards manually."</p>
                    </div>

                    <div class="bg-gray-50 rounded-2xl p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user text-green-600"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900">Marcus T.</div>
                                <div class="text-sm text-gray-600">Law Student</div>
                            </div>
                        </div>
                        <p class="text-gray-700 italic">"Finally, a study tool that actually saves time. The rich text editor is a game-changer for organizing my notes."</p>
                    </div>

                    <div class="bg-gray-50 rounded-2xl p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user text-purple-600"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900">Emma K.</div>
                                <div class="text-sm text-gray-600">MBA Candidate</div>
                            </div>
                        </div>
                        <p class="text-gray-700 italic">"The progress tracking feature helped me identify my weak areas. My study efficiency improved dramatically."</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Final CTA -->
        <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-3xl md:text-4xl font-bold mb-6">
                    Ready to Transform Your Study Routine?
                </h2>
                <p class="text-xl opacity-90 mb-8">
                    Join thousands of students who are already studying smarter with Jaquizy
                </p>
                
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        @click="showAuth('register')"
                        class="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                        <i class="fas fa-rocket mr-2"></i>
                        Start Your Free Account
                    </button>
                    <button 
                        @click="showAuth('login')"
                        class="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
                    >
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Sign In
                    </button>
                </div>
                
                <p class="text-sm opacity-75 mt-4">
                    No credit card required • Setup in 30 seconds
                </p>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-gray-300 py-12">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <div class="flex items-center mb-4">
                            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-brain text-white"></i>
                            </div>
                            <div class="text-white font-bold text-xl">Jaquizy</div>
                        </div>
                        <p class="text-sm">
                            AI-powered study platform that transforms your notes into personalized quiz questions.
                        </p>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold mb-4">Product</h4>
                        <ul class="space-y-2 text-sm">
                            <li><a href="#" class="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">FAQ</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold mb-4">Legal</h4>
                        <ul class="space-y-2 text-sm">
                            <li><a href="/legal/privacy-policy.html" class="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="/legal/terms-of-service.html" class="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold mb-4">Support</h4>
                        <ul class="space-y-2 text-sm">
                            <li><a href="mailto:support@jaquizy.com" class="hover:text-white transition-colors">Contact Us</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                    <p>&copy; 2025 Jaquizy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>
    `,

    setup() {
        const store = window.store;

        const showAuth = (mode) => {
            // Find the main app's authMode ref and update it directly
            if (window.appAuthMode) {
                window.appAuthMode.value = mode;
            } else {
                // Fallback to dispatching a custom event
                window.dispatchEvent(new CustomEvent('setAuthMode', { detail: mode }));
            }
        };

        const scrollToDemo = () => {
            document.getElementById('demo')?.scrollIntoView({ 
                behavior: 'smooth' 
            });
        };

        return {
            showAuth,
            scrollToDemo
        };
    }
};