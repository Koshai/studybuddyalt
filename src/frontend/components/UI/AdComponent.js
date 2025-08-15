// components/UI/AdComponent.js - Google AdSense Integration
window.AdComponent = {
    template: `
    <div v-if="shouldShowAd" class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm relative">
        <!-- Ad Header with Pro Upgrade Option -->
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-600">
                <i class="fas fa-bullhorn text-gray-400 mr-1"></i>
                Sponsored
            </h4>
            <button 
                v-if="store.state.subscriptionTier === 'free'" 
                @click="showUpgradeModal" 
                class="text-xs text-purple-600 hover:text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded-full transition-colors"
                title="Upgrade to remove ads"
            >
                <i class="fas fa-crown mr-1"></i>
                Ad-Free
            </button>
        </div>

        <!-- Google AdSense Ad Container -->
        <div class="ad-container bg-gray-50 rounded-lg overflow-hidden relative" :class="containerSizeClass">
            <!-- AdSense Script will be injected here -->
            <ins 
                class="adsbygoogle block"
                style="display:block"
                :data-ad-client="adClient"
                :data-ad-slot="adSlotId"
                :data-ad-format="adFormat"
                data-full-width-responsive="true"
            ></ins>
            
            <!-- Fallback content if ads are blocked -->
            <div v-if="adBlocked" class="flex flex-col items-center justify-center h-[250px] text-gray-400 p-4 text-center">
                <i class="fas fa-ad text-2xl mb-2"></i>
                <p class="text-sm mb-2">Ad content unavailable</p>
                <button 
                    @click="showUpgradeModal" 
                    class="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors"
                >
                    <i class="fas fa-crown mr-1"></i>
                    Upgrade for Ad-Free Experience
                </button>
            </div>

            <!-- Loading state for ads -->
            <div v-if="adLoading && !adBlocked" class="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div class="text-center text-gray-400">
                    <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                    <p class="text-sm">Loading content...</p>
                </div>
            </div>
        </div>

        <!-- Privacy & Ad Information -->
        <div class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span class="flex items-center">
                    <i class="fas fa-info-circle mr-1"></i>
                    Ads help keep StudyBuddy free
                </span>
                <a 
                    href="#" 
                    @click.prevent="showAdInfo"
                    class="hover:text-gray-700 transition-colors"
                >
                    Ad Choices
                </a>
            </div>
        </div>
    </div>
    `,

    props: {
        placement: {
            type: String,
            default: 'sidebar'
        },
        size: {
            type: String, 
            default: 'medium'
        }
    },

    setup(props) {
        const store = window.store;
        
        // Ad configuration - Replace with your actual AdSense publisher ID
        const adClient = process.env.NODE_ENV === 'production' 
            ? 'ca-pub-XXXXXXXXXXXXXXXXX' // Replace with actual AdSense publisher ID
            : 'ca-pub-test-client-id';
        const adLoading = Vue.ref(true);
        const adBlocked = Vue.ref(false);
        
        // Dynamic ad configuration based on size and placement
        const containerSizeClass = Vue.computed(() => {
            switch (props.size) {
                case 'small': return 'min-h-[200px]';
                case 'medium': return 'min-h-[250px]';
                case 'large': return 'min-h-[300px]';
                default: return 'min-h-[250px]';
            }
        });

        const adSlotId = Vue.computed(() => {
            // Different ad slots for different placements - Replace with your actual slot IDs
            if (process.env.NODE_ENV === 'production') {
                switch (props.placement) {
                    case 'dashboard_sidebar': return 'XXXXXXXXXX'; // Replace with actual sidebar slot ID
                    case 'practice_completion': return 'XXXXXXXXXX'; // Replace with actual completion slot ID
                    default: return 'XXXXXXXXXX'; // Replace with actual default slot ID
                }
            } else {
                // Test slot IDs for development
                return 'test-slot-id';
            }
        });

        const adFormat = Vue.computed(() => {
            switch (props.size) {
                case 'small': return 'rectangle';
                case 'medium': return 'rectangle'; 
                case 'large': return 'horizontal';
                default: return 'rectangle';
            }
        });
        
        // Ad display logic
        const shouldShowAd = Vue.computed(() => {
            // Only show ads for free tier users
            if (store.state.subscriptionTier === 'pro') return false;
            
            // Don't show ads during initial loading
            if (store.state.authLoading) return false;
            
            // Allow admin override to hide ads
            if (store.state.hideAds) return false;
            
            return true;
        });

        // Initialize AdSense
        const initializeAdSense = () => {
            // Load Google AdSense script if not already loaded
            if (!window.adsbygoogle) {
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adClient;
                script.crossOrigin = 'anonymous';
                
                script.onload = () => {
                    console.log('📢 Google AdSense loaded successfully');
                    pushAd();
                };
                
                script.onerror = () => {
                    console.warn('📢 AdSense failed to load - likely ad blocker');
                    adBlocked.value = true;
                    adLoading.value = false;
                };
                
                document.head.appendChild(script);
            } else {
                pushAd();
            }
        };

        // Push ad to AdSense
        const pushAd = () => {
            try {
                if (window.adsbygoogle && window.adsbygoogle.loaded) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    adLoading.value = false;
                } else {
                    // Retry after a short delay
                    setTimeout(() => {
                        if (window.adsbygoogle) {
                            (window.adsbygoogle = window.adsbygoogle || []).push({});
                            adLoading.value = false;
                        } else {
                            adBlocked.value = true;
                            adLoading.value = false;
                        }
                    }, 2000);
                }
            } catch (error) {
                console.warn('📢 AdSense push failed:', error);
                adBlocked.value = true;
                adLoading.value = false;
            }
        };

        // User actions
        const showUpgradeModal = () => {
            // Call the main app's upgrade modal function with reason
            if (window.app && window.app.showUpgradeModal) {
                window.app.showUpgradeModal(`ad_${props.placement}`);
            } else {
                // Fallback notification
                store.showNotification(
                    'Upgrade to StudyBuddy Pro for an ad-free experience! Contact support for details.',
                    'info'
                );
            }
            
            // Track upgrade interest for analytics
            trackEvent('ad_upgrade_click', {
                placement: props.placement,
                tier: store.state.subscriptionTier
            });
        };

        const showAdInfo = () => {
            store.showNotification(
                'StudyBuddy uses Google AdSense to show relevant ads. Ads help us keep the free tier available. Upgrade to Pro for an ad-free experience!',
                'info'
            );
        };

        // Analytics tracking
        const trackEvent = (eventName, properties) => {
            try {
                // Integrate with your analytics service
                if (window.analytics && window.analytics.track) {
                    window.analytics.track(eventName, properties);
                }
                
                // Basic console logging for now
                console.log(`📊 Event: ${eventName}`, properties);
            } catch (error) {
                console.warn('Analytics tracking failed:', error);
            }
        };

        // Lifecycle
        Vue.onMounted(() => {
            if (shouldShowAd.value) {
                // Small delay to ensure DOM is ready
                setTimeout(initializeAdSense, 500);
                
                // Track ad impression
                trackEvent('ad_impression', {
                    placement: props.placement,
                    size: props.size,
                    tier: store.state.subscriptionTier
                });
            }
        });

        // Cleanup
        Vue.onUnmounted(() => {
            // Clean up any ad-related resources if needed
        });

        return {
            store,
            adClient,
            adLoading,
            adBlocked,
            containerSizeClass,
            adSlotId,
            adFormat,
            shouldShowAd,
            showUpgradeModal,
            showAdInfo
        };
    }
};