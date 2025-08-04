// src/server/services/usage-service-hybrid.js
// Hybrid usage tracking: Supabase (primary) + SQLite (fallback)

const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');

class HybridUsageService {
    constructor() {
        // Initialize Supabase
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        // Initialize SQLite for offline/cache
        const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
        this.sqlite = new Database(dbPath);
        
        this.isOnline = true;
        this.initializeTables();
        this.setupOnlineDetection();
        
        this.limits = {
            free: {
                questionsPerMonth: 100,
                topicsPerSubject: 5,
                storageBytes: 100 * 1024 * 1024 // 100MB
            },
            pro: {
                questionsPerMonth: 1500,
                topicsPerSubject: -1, // unlimited
                storageBytes: 5 * 1024 * 1024 * 1024 // 5GB
            }
        };
    }

    initializeTables() {
        // Ensure SQLite tables exist for offline functionality
        try {
            this.sqlite.exec(`
                CREATE TABLE IF NOT EXISTS user_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    month_year TEXT NOT NULL,
                    questions_used INTEGER DEFAULT 0,
                    storage_used INTEGER DEFAULT 0,
                    topics_created INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    synced_at DATETIME,
                    is_dirty INTEGER DEFAULT 0,
                    UNIQUE(user_id, month_year)
                )
            `);
            
            console.log('✅ Hybrid usage service tables initialized');
        } catch (error) {
            console.error('❌ Failed to initialize usage tables:', error);
        }
    }

    setupOnlineDetection() {
        // Check Supabase connectivity
        setInterval(async () => {
            try {
                const { error } = await this.supabase
                    .from('user_usage')
                    .select('id')
                    .limit(1);
                
                const wasOnline = this.isOnline;
                this.isOnline = !error;
                
                if (!wasOnline && this.isOnline) {
                    console.log('🌐 Usage service back online - syncing...');
                    await this.syncPendingUsage();
                }
            } catch (error) {
                this.isOnline = false;
            }
        }, 30000);
    }

    async syncPendingUsage() {
        try {
            const pendingUsage = this.sqlite.prepare(`
                SELECT * FROM user_usage WHERE is_dirty = 1
            `).all();

            for (const usage of pendingUsage) {
                try {
                    const { error } = await this.supabase
                        .from('user_usage')
                        .upsert({
                            user_id: usage.user_id,
                            month_year: usage.month_year,
                            questions_used: usage.questions_used,
                            storage_used: usage.storage_used,
                            topics_created: usage.topics_created,
                            updated_at: new Date().toISOString()
                        });

                    if (!error) {
                        // Mark as synced
                        this.sqlite.prepare(`
                            UPDATE user_usage 
                            SET is_dirty = 0, synced_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        `).run(usage.id);
                    }
                } catch (error) {
                    console.error('Failed to sync usage for', usage.user_id, error);
                }
            }
        } catch (error) {
            console.error('Usage sync failed:', error);
        }
    }

    async getCurrentUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        try {
            if (this.isOnline) {
                // Try Supabase first
                const { data, error } = await this.supabase
                    .from('user_usage')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('month_year', currentMonth)
                    .single();

                if (!error && data) {
                    // Update local cache
                    this.upsertLocalUsage(data);
                    return data;
                }
                
                if (error && error.code === 'PGRST116') {
                    // Record doesn't exist, create it
                    return await this.initializeMonthlyUsage(userId);
                }
            }
            
            // Fallback to local data
            const stmt = this.sqlite.prepare(`
                SELECT * FROM user_usage 
                WHERE user_id = ? AND month_year = ?
            `);
            
            let usage = stmt.get(userId, currentMonth);
            
            if (!usage) {
                usage = await this.initializeMonthlyUsage(userId);
            }
            
            return usage;
            
        } catch (error) {
            console.error('❌ Failed to get usage data:', error);
            
            // Fallback to local
            const stmt = this.sqlite.prepare(`
                SELECT * FROM user_usage 
                WHERE user_id = ? AND month_year = ?
            `);
            
            let usage = stmt.get(userId, currentMonth);
            
            if (!usage) {
                usage = await this.initializeMonthlyUsage(userId);
            }
            
            return usage;
        }
    }

    async initializeMonthlyUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const usageData = {
            user_id: userId,
            month_year: currentMonth,
            questions_used: 0,
            storage_used: 0,
            topics_created: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        try {
            if (this.isOnline) {
                // Create in Supabase
                const { data, error } = await this.supabase
                    .from('user_usage')
                    .insert(usageData)
                    .select()
                    .single();

                if (!error) {
                    // Cache locally
                    this.upsertLocalUsage({ ...data, synced_at: new Date().toISOString() });
                    return data;
                }
            }
            
            // Fallback to local creation
            const stmt = this.sqlite.prepare(`
                INSERT OR IGNORE INTO user_usage 
                (user_id, month_year, questions_used, storage_used, topics_created, is_dirty)
                VALUES (?, ?, 0, 0, 0, 1)
            `);
            
            stmt.run(userId, currentMonth);
            
            const getStmt = this.sqlite.prepare(`
                SELECT * FROM user_usage 
                WHERE user_id = ? AND month_year = ?
            `);
            
            const usage = getStmt.get(userId, currentMonth);
            console.log(`✅ Monthly usage initialized locally for user ${userId}: ${currentMonth}`);
            
            return usage;
            
        } catch (error) {
            console.error('❌ Failed to initialize monthly usage:', error);
            throw new Error('Failed to initialize usage tracking');
        }
    }

    async incrementStorageUsage(userId, bytes) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        try {
            // Ensure usage record exists
            await this.getCurrentUsage(userId);
            
            if (this.isOnline) {
                // Update in Supabase
                const { error } = await this.supabase.rpc('increment_storage_usage', {
                    p_user_id: userId,
                    p_month_year: currentMonth,
                    p_bytes: bytes
                });

                if (!error) {
                    // Update local cache
                    this.sqlite.prepare(`
                        UPDATE user_usage 
                        SET storage_used = storage_used + ?, updated_at = CURRENT_TIMESTAMP, synced_at = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND month_year = ?
                    `).run(bytes, userId, currentMonth);
                    
                    console.log(`✅ Storage usage updated in Supabase for user ${userId}: +${bytes} bytes`);
                    return;
                }
            }
            
            // Fallback to local update
            const stmt = this.sqlite.prepare(`
                UPDATE user_usage 
                SET storage_used = storage_used + ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1
                WHERE user_id = ? AND month_year = ?
            `);
            
            const result = stmt.run(bytes, userId, currentMonth);
            
            if (result.changes === 0) {
                throw new Error('Failed to update storage usage - record not found');
            }
            
            console.log(`✅ Storage usage updated locally for user ${userId}: +${bytes} bytes`);
            
        } catch (error) {
            console.error('❌ Failed to update storage usage:', error);
            throw new Error('Failed to update storage usage');
        }
    }

    async incrementQuestionUsage(userId, count = 1) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        try {
            await this.getCurrentUsage(userId);
            
            if (this.isOnline) {
                const { error } = await this.supabase.rpc('increment_question_usage', {
                    p_user_id: userId,
                    p_month_year: currentMonth,
                    p_count: count
                });

                if (!error) {
                    this.sqlite.prepare(`
                        UPDATE user_usage 
                        SET questions_used = questions_used + ?, updated_at = CURRENT_TIMESTAMP, synced_at = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND month_year = ?
                    `).run(count, userId, currentMonth);
                    
                    console.log(`✅ Question usage updated in Supabase for user ${userId}: +${count} questions`);
                    return;
                }
            }
            
            // Fallback to local
            const stmt = this.sqlite.prepare(`
                UPDATE user_usage 
                SET questions_used = questions_used + ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1
                WHERE user_id = ? AND month_year = ?
            `);
            
            const result = stmt.run(count, userId, currentMonth);
            
            if (result.changes === 0) {
                throw new Error('Failed to update question usage - record not found');
            }
            
            console.log(`✅ Question usage updated locally for user ${userId}: +${count} questions`);
            
        } catch (error) {
            console.error('❌ Failed to update question usage:', error);
            throw new Error('Failed to update question usage');
        }
    }

    async checkStorageLimit(userId, userTier, fileSize) {
        const usage = await this.getCurrentUsage(userId);
        const limit = this.limits[userTier || 'free'].storageBytes;
        
        if (usage.storage_used + fileSize > limit) {
            const usedMB = Math.round(usage.storage_used / (1024 * 1024));
            const limitMB = Math.round(limit / (1024 * 1024));
            const fileMB = Math.round(fileSize / (1024 * 1024));
            
            throw new Error(`Storage limit would be exceeded. Current: ${usedMB}MB, Limit: ${limitMB}MB, File: ${fileMB}MB. Upgrade to Pro for more storage.`);
        }
        
        return true;
    }

    async checkQuestionLimit(userId, userTier) {
        const usage = await this.getCurrentUsage(userId);
        const limit = this.limits[userTier || 'free'].questionsPerMonth;
        
        if (usage.questions_used >= limit) {
            throw new Error(`Question limit reached (${usage.questions_used}/${limit}). Upgrade to Pro for more questions.`);
        }
        
        return true;
    }

    async checkTopicLimit(userId, userTier, subjectId, db) {
        const limits = this.limits[userTier || 'free'];
        
        if (limits.topicsPerSubject === -1) {
            return true; // Unlimited for pro users
        }
        
        try {
            // Try to get from Supabase first if online
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('topics')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('subject_id', subjectId);

                if (!error) {
                    const currentCount = data.length;
                    
                    if (currentCount >= limits.topicsPerSubject) {
                        throw new Error(`Topic limit reached (${currentCount}/${limits.topicsPerSubject}). Upgrade to Pro for unlimited topics.`);
                    }
                    
                    return true;
                }
            }
            
            // Fallback to local count
            const stmt = this.sqlite.prepare(`
                SELECT COUNT(*) as count 
                FROM topics 
                WHERE subject_id = ? AND user_id = ?
            `);
            
            const result = stmt.get(subjectId, userId);
            const currentCount = result.count;
            
            if (currentCount >= limits.topicsPerSubject) {
                throw new Error(`Topic limit reached (${currentCount}/${limits.topicsPerSubject}). Upgrade to Pro for unlimited topics.`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to check topic limit:', error);
            throw error;
        }
    }

    async getUsageStats(userId) {
        try {
            const usage = await this.getCurrentUsage(userId);
            
            // Get user tier (you may need to implement this based on your user structure)
            const tier = 'free'; // TODO: Get from user record
            const limits = this.limits[tier];

            return {
                questions: {
                    used: usage.questions_used,
                    limit: limits.questionsPerMonth,
                    percentage: Math.round((usage.questions_used / limits.questionsPerMonth) * 100)
                },
                storage: {
                    used: usage.storage_used,
                    limit: limits.storageBytes,
                    percentage: Math.round((usage.storage_used / limits.storageBytes) * 100),
                    usedMB: Math.round(usage.storage_used / (1024 * 1024)),
                    limitMB: Math.round(limits.storageBytes / (1024 * 1024))
                },
                topics: {
                    used: usage.topics_created || 0,
                    limit: limits.topicsPerSubject === -1 ? 999 : limits.topicsPerSubject
                },
                tier: tier,
                isOnline: this.isOnline,
                lastSync: usage.synced_at
            };
        } catch (error) {
            console.error('❌ Failed to get usage stats:', error);
            
            // Return default stats to prevent crashes
            return {
                questions: { used: 0, limit: 100, percentage: 0 },
                storage: { used: 0, limit: 104857600, percentage: 0, usedMB: 0, limitMB: 100 },
                topics: { used: 0, limit: 5 },
                tier: 'free',
                isOnline: this.isOnline,
                error: error.message
            };
        }
    }

    upsertLocalUsage(data) {
        const stmt = this.sqlite.prepare(`
            INSERT OR REPLACE INTO user_usage 
            (user_id, month_year, questions_used, storage_used, topics_created, created_at, updated_at, synced_at, is_dirty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `);
        
        return stmt.run(
            data.user_id,
            data.month_year,
            data.questions_used,
            data.storage_used,
            data.topics_created || 0,
            data.created_at,
            data.updated_at,
            data.synced_at || new Date().toISOString()
        );
    }

    getConnectionStatus() {
        const pendingCount = this.sqlite.prepare(`
            SELECT COUNT(*) as count FROM user_usage WHERE is_dirty = 1
        `).get().count;

        return {
            isOnline: this.isOnline,
            pendingSync: pendingCount
        };
    }
}

module.exports = HybridUsageService;