// components/Layout/Notifications.js

window.NotificationsComponent = {
    template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <Transition
            v-for="notification in store.state.notifications"
            :key="notification.id"
            name="notification"
            appear
        >
            <div
                :class="[
                    'px-6 py-4 rounded-lg shadow-lg text-white font-medium flex items-center space-x-3 cursor-pointer',
                    getNotificationClasses(notification.type)
                ]"
                @click="store.removeNotification(notification.id)"
            >
                <!-- Icon -->
                <div class="flex-shrink-0">
                    <i :class="getNotificationIcon(notification.type)" class="text-lg"></i>
                </div>
                
                <!-- Content -->
                <div class="flex-1">
                    <p class="text-sm">{{ notification.message }}</p>
                    <p class="text-xs opacity-75 mt-1">
                        {{ formatTime(notification.timestamp) }}
                    </p>
                </div>
                
                <!-- Close button -->
                <button 
                    @click.stop="store.removeNotification(notification.id)"
                    class="flex-shrink-0 opacity-75 hover:opacity-100 transition-opacity"
                >
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        </Transition>
    </div>
    `,

    setup() {
        const store = window.store;

        const getNotificationClasses = (type) => {
            const classes = {
                success: 'md-notification-success',
                error: 'md-notification-error',
                warning: 'md-notification-warning',
                info: 'md-notification-info'
            };
            return classes[type] || classes.info;
        };

        const getNotificationIcon = (type) => {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-triangle',
                warning: 'fas fa-exclamation-circle',
                info: 'fas fa-info-circle'
            };
            return icons[type] || icons.info;
        };

        const formatTime = (timestamp) => {
            const now = Date.now();
            const diff = now - timestamp;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            
            return new Date(timestamp).toLocaleDateString();
        };

        return {
            store,
            getNotificationClasses,
            getNotificationIcon,
            formatTime
        };
    }
};

// Add CSS for transition effects
const notificationStyles = `
<style>
.notification-enter-active,
.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
}

.notification-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
}

.notification-enter-to,
.notification-leave-from {
    opacity: 1;
    transform: translateX(0) scale(1);
}
</style>
`;

// Inject styles into head
if (!document.querySelector('#notification-styles')) {
    const styleEl = document.createElement('div');
    styleEl.id = 'notification-styles';
    styleEl.innerHTML = notificationStyles;
    document.head.appendChild(styleEl);
}