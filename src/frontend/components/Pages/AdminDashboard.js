// src/frontend/components/Pages/AdminDashboard.js
const AdminDashboard = {
    name: 'AdminDashboard',
    setup() {
        const loading = Vue.ref(false);
        const error = Vue.ref(null);
        const success = Vue.ref(null);
        
        const syncStatus = Vue.ref(null);
        const syncLogs = Vue.ref([]);
        const isAdmin = Vue.ref(false);
        
        // Manual sync form
        const syncForm = Vue.reactive({
            userEmail: '',
            userId: '',
            syncType: 'full'
        });
        
        // Check admin access on mount
        Vue.onMounted(async () => {
            await checkAdminAccess();
            if (isAdmin.value) {
                await loadSyncStatus();
                await loadSyncLogs();
            }
        });
        
        const checkAdminAccess = async () => {
            try {
                loading.value = true;
                isAdmin.value = await window.api.checkAdminAccess();
                if (!isAdmin.value) {
                    error.value = 'Access denied. Admin privileges required.';
                }
            } catch (err) {
                console.error('Admin access check failed:', err);
                error.value = 'Unable to verify admin access: ' + err.message;
                isAdmin.value = false;
            } finally {
                loading.value = false;
            }
        };
        
        const loadSyncStatus = async () => {
            try {
                loading.value = true;
                error.value = null;
                
                const response = await window.api.getAdminSyncStatus();
                syncStatus.value = response;
                
                console.log('📊 Admin sync status loaded:', response);
                
            } catch (err) {
                console.error('Failed to load sync status:', err);
                error.value = 'Failed to load sync status: ' + err.message;
            } finally {
                loading.value = false;
            }
        };
        
        const loadSyncLogs = async () => {
            try {
                const response = await window.api.getAdminSyncLogs(50);
                syncLogs.value = response.logs || [];
                
                console.log('📋 Admin sync logs loaded:', response);
                
            } catch (err) {
                console.error('Failed to load sync logs:', err);
                error.value = 'Failed to load sync logs: ' + err.message;
            }
        };
        
        const triggerManualSync = async () => {
            if (!syncForm.userEmail && !syncForm.userId) {
                error.value = 'Please provide either user email or user ID';
                return;
            }
            
            try {
                loading.value = true;
                error.value = null;
                success.value = null;
                
                console.log('🔄 Triggering manual sync:', syncForm);
                
                const response = await window.api.triggerAdminSync(
                    syncForm.userId || null,
                    syncForm.userEmail || null,
                    syncForm.syncType
                );
                
                success.value = `Manual sync completed for user: ${response.userEmail || response.userId}`;
                console.log('✅ Manual sync completed:', response);
                
                // Reload data
                await loadSyncStatus();
                await loadSyncLogs();
                
                // Clear form
                syncForm.userEmail = '';
                syncForm.userId = '';
                syncForm.syncType = 'full';
                
            } catch (err) {
                console.error('Manual sync failed:', err);
                error.value = 'Manual sync failed: ' + err.message;
            } finally {
                loading.value = false;
            }
        };
        
        const repairDatabase = async (action) => {
            if (!confirm(`Are you sure you want to ${action} the database? This action cannot be undone.`)) {
                return;
            }
            
            try {
                loading.value = true;
                error.value = null;
                success.value = null;
                
                console.log(`🔧 Database repair: ${action}`);
                
                const response = await window.api.repairAdminDatabase(action);
                
                success.value = `Database ${action} completed successfully`;
                console.log('✅ Database repair completed:', response);
                
                // Reload status
                await loadSyncStatus();
                
            } catch (err) {
                console.error('Database repair failed:', err);
                error.value = 'Database repair failed: ' + err.message;
            } finally {
                loading.value = false;
            }
        };
        
        const refreshData = async () => {
            await loadSyncStatus();
            await loadSyncLogs();
            success.value = 'Data refreshed successfully';
        };
        
        const clearMessages = () => {
            error.value = null;
            success.value = null;
        };
        
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            return new Date(timestamp).toLocaleString();
        };
        
        const getTableStatusColor = (table) => {
            if (!table.exists) return 'text-red-600';
            if (table.count === 0) return 'text-yellow-600';
            return 'text-green-600';
        };
        
        const getTableStatusIcon = (table) => {
            if (!table.exists) return '❌';
            if (table.count === 0) return '⚠️';
            return '✅';
        };
        
        return {
            loading,
            error,
            success,
            syncStatus,
            syncLogs,
            isAdmin,
            syncForm,
            checkAdminAccess,
            loadSyncStatus,
            loadSyncLogs,
            triggerManualSync,
            repairDatabase,
            refreshData,
            clearMessages,
            formatTimestamp,
            getTableStatusColor,
            getTableStatusIcon
        };
    },
    
    template: `
        <div class="admin-dashboard">
            <!-- Header -->
            <div class="bg-white shadow-sm border-b border-gray-200 p-4 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p class="text-gray-600">Database sync management and monitoring</p>
                    </div>
                    <div class="flex gap-2">
                        <button 
                            @click="refreshData" 
                            :disabled="loading"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Access Denied -->
            <div v-if="!isAdmin && !loading" class="text-center py-12">
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <div class="text-red-600 text-6xl mb-4">🚫</div>
                    <h2 class="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
                    <p class="text-red-700">Admin privileges required to access this dashboard.</p>
                </div>
            </div>
            
            <!-- Loading State -->
            <div v-if="loading" class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Loading admin data...</p>
            </div>
            
            <!-- Admin Content -->
            <div v-if="isAdmin && !loading" class="space-y-6">
                
                <!-- Messages -->
                <div v-if="error || success" class="space-y-2">
                    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div class="flex">
                                <div class="text-red-500 mr-3">❌</div>
                                <div>
                                    <h4 class="text-red-800 font-medium">Error</h4>
                                    <p class="text-red-700 text-sm">{{ error }}</p>
                                </div>
                            </div>
                            <button @click="clearMessages" class="text-red-500 hover:text-red-700">✕</button>
                        </div>
                    </div>
                    
                    <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div class="flex">
                                <div class="text-green-500 mr-3">✅</div>
                                <div>
                                    <h4 class="text-green-800 font-medium">Success</h4>
                                    <p class="text-green-700 text-sm">{{ success }}</p>
                                </div>
                            </div>
                            <button @click="clearMessages" class="text-green-500 hover:text-green-700">✕</button>
                        </div>
                    </div>
                </div>
                
                <!-- Sync Status -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">🔄 Sync Status</h2>
                    
                    <div v-if="syncStatus" class="space-y-4">
                        <!-- Environment Info -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="font-semibold text-gray-800 mb-2">Environment Information</h3>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span class="font-medium text-gray-600">Environment:</span>
                                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                        {{ syncStatus.environment }}
                                    </span>
                                </div>
                                <div>
                                    <span class="font-medium text-gray-600">Last Check:</span>
                                    <span class="ml-2 text-gray-800">{{ formatTimestamp(syncStatus.timestamp) }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- SQLite Database Status -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="font-semibold text-gray-800 mb-3">📄 SQLite Database</h3>
                            <div class="text-xs text-gray-600 mb-3">{{ syncStatus.sqlite.dbPath }}</div>
                            
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div 
                                    v-for="(table, tableName) in syncStatus.sqlite.tables" 
                                    :key="tableName"
                                    class="bg-white rounded p-3 border"
                                >
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-medium text-gray-800 text-sm">{{ tableName }}</span>
                                        <span>{{ getTableStatusIcon(table) }}</span>
                                    </div>
                                    <div :class="['text-sm', getTableStatusColor(table)]">
                                        {{ table.exists ? \`\${table.count} records\` : 'Table missing' }}
                                    </div>
                                    <div v-if="table.error" class="text-xs text-red-600 mt-1">
                                        {{ table.error }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Supabase Status -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="font-semibold text-gray-800 mb-3">☁️ Supabase Connection</h3>
                            <div class="flex items-center gap-3">
                                <div :class="[
                                    'w-3 h-3 rounded-full',
                                    syncStatus.supabase.connected ? 'bg-green-500' : 'bg-red-500'
                                ]"></div>
                                <span :class="[
                                    'font-medium',
                                    syncStatus.supabase.connected ? 'text-green-700' : 'text-red-700'
                                ]">
                                    {{ syncStatus.supabase.connected ? 'Connected' : 'Disconnected' }}
                                </span>
                                <div v-if="syncStatus.supabase.error" class="text-sm text-red-600">
                                    Error: {{ syncStatus.supabase.error }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Manual Sync Controls -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">🔄 Manual Sync Control</h2>
                    
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">User Email</label>
                                <input 
                                    v-model="syncForm.userEmail"
                                    type="email"
                                    placeholder="user@example.com"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">User ID (Optional)</label>
                                <input 
                                    v-model="syncForm.userId"
                                    type="text"
                                    placeholder="uuid-user-id"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Sync Type</label>
                            <select 
                                v-model="syncForm.syncType"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="full">Full Sync</option>
                                <option value="pull">Pull from Supabase</option>
                                <option value="push">Push to Supabase</option>
                            </select>
                        </div>
                        
                        <div class="flex gap-3">
                            <button 
                                @click="triggerManualSync"
                                :disabled="loading || (!syncForm.userEmail && !syncForm.userId)"
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                🚀 Trigger Sync
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Database Repair -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">🔧 Database Management</h2>
                    
                    <div class="space-y-3">
                        <p class="text-gray-600 text-sm">
                            Use these tools to repair or recreate database tables when sync issues occur.
                        </p>
                        
                        <div class="flex gap-3 flex-wrap">
                            <button 
                                @click="repairDatabase('recreate')"
                                :disabled="loading"
                                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                            >
                                🔄 Recreate Tables
                            </button>
                            
                            <button 
                                @click="repairDatabase('migrate')"
                                :disabled="loading"
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                ⬆️ Run Migration
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Sync Logs -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">📋 Recent Activity</h2>
                    
                    <div v-if="syncLogs.length > 0" class="space-y-2">
                        <div 
                            v-for="(log, index) in syncLogs" 
                            :key="index"
                            class="border-l-4 pl-4 py-2 bg-gray-50"
                            :class="{
                                'border-blue-500': log.type === 'info',
                                'border-green-500': log.type === 'sync',
                                'border-red-500': log.type === 'error',
                                'border-yellow-500': log.type === 'warning'
                            }"
                        >
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ log.message }}</p>
                                    <p v-if="log.details" class="text-xs text-gray-600 mt-1">{{ log.details }}</p>
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ formatTimestamp(log.timestamp) }}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">📝</div>
                        <p>No activity logs available</p>
                    </div>
                </div>
                
            </div>
        </div>
    `
};

// Export component to global scope
window.AdminDashboardComponent = AdminDashboard;