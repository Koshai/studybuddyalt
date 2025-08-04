// src/server/services/usage-service.js - SQLite3 Compatible Version
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class UsageService {
    constructor() {
        // Use the same database as the main app
        const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
        this.db = new sqlite3.Database(dbPath);
        
        // Initialize usage tables if they don't exist
        this.initializeTables();
        
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
        // Create user_usage table if it doesn't exist
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                month_year TEXT NOT NULL,
                questions_used INTEGER DEFAULT 0,
                storage_used INTEGER DEFAULT 0,
                topics_created INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, month_year)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Failed to initialize usage tables:', err);
            } else {
                console.log('✅ Usage service tables initialized');
            }
        });
    }

    async getCurrentUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM user_usage 
                WHERE user_id = ? AND month_year = ?
            `, [userId, currentMonth], async (err, row) => {
                if (err) {
                    console.error('❌ Failed to get usage data:', err);
                    reject(new Error('Failed to get usage data'));
                    return;
                }
                
                let usage = row;
                
                if (!usage) {
                    // Create usage record if it doesn't exist
                    try {
                        usage = await this.initializeMonthlyUsage(userId);
                        resolve(usage);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(usage);
                }
            });
        });
    }

    async checkQuestionLimit(userId, userTier) {
        const usage = await this.getCurrentUsage(userId);
        const limit = this.limits[userTier || 'free'].questionsPerMonth;
        
        if (usage.questions_used >= limit) {
            throw new Error(`Monthly question limit reached (${limit}). Upgrade to Pro for more questions!`);
        }

        return {
            used: usage.questions_used,
            limit: limit,
            remaining: limit - usage.questions_used
        };
    }

    async incrementQuestionUsage(userId, count = 1) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE user_usage 
                SET questions_used = questions_used + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND month_year = ?
            `, [count, userId, currentMonth], function(err) {
                if (err) {
                    console.error('❌ Failed to update question usage:', err);
                    reject(new Error('Failed to update question usage'));
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('Failed to update question usage - record not found'));
                    return;
                }
                
                console.log(`✅ Question usage updated for user ${userId}: +${count} questions`);
                resolve();
            });
        });
    }

    async checkTopicLimit(userId, userTier, subjectId, dbService = null) {
        const limit = this.limits[userTier || 'free'].topicsPerSubject;
        
        if (limit === -1) return true; // Unlimited for pro
        
        // Use local database service if provided
        if (dbService) {
            try {
                const userTopics = await dbService.getTopicsForUser(subjectId, userId);
                
                if (userTopics.length >= limit) {
                    throw new Error(`Topic limit reached for this subject (${limit}). Upgrade to Pro for unlimited topics!`);
                }
                
                return true;
            } catch (error) {
                console.warn('Warning: Topic limit check failed, allowing creation:', error.message);
                return true; // Allow creation if check fails
            }
        }
        
        // Fallback: check directly in database
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT COUNT(*) as count 
                FROM topics 
                WHERE subject_id = ? AND user_id = ?
            `, [subjectId, userId], (err, row) => {
                if (err) {
                    console.warn('Warning: Topic limit check failed, allowing creation:', err.message);
                    resolve(true); // Allow creation if check fails
                    return;
                }
                
                const currentCount = row.count;
                
                if (currentCount >= limit) {
                    reject(new Error(`Topic limit reached (${currentCount}/${limit}). Upgrade to Pro for unlimited topics.`));
                    return;
                }
                
                resolve(true);
            });
        });
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

    async incrementStorageUsage(userId, bytes) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE user_usage 
                SET storage_used = storage_used + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND month_year = ?
            `, [bytes, userId, currentMonth], function(err) {
                if (err) {
                    console.error('❌ Failed to update storage usage:', err);
                    reject(new Error('Failed to update storage usage'));
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('Failed to update storage usage - record not found'));
                    return;
                }
                
                console.log(`✅ Storage usage updated for user ${userId}: +${bytes} bytes`);
                resolve();
            });
        });
    }

    async initializeMonthlyUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR IGNORE INTO user_usage 
                (user_id, month_year, questions_used, storage_used, topics_created)
                VALUES (?, ?, 0, 0, 0)
            `, [userId, currentMonth], (err) => {
                if (err) {
                    console.error('❌ Failed to initialize monthly usage:', err);
                    reject(new Error('Failed to initialize usage tracking'));
                    return;
                }
                
                // Return the created record
                this.db.get(`
                    SELECT * FROM user_usage 
                    WHERE user_id = ? AND month_year = ?
                `, [userId, currentMonth], (err, row) => {
                    if (err) {
                        console.error('❌ Failed to get initialized usage:', err);
                        reject(new Error('Failed to get usage tracking'));
                        return;
                    }
                    
                    console.log(`✅ Monthly usage initialized for user ${userId}: ${currentMonth}`);
                    resolve(row);
                });
            });
        });
    }

    async getUsageStats(userId) {
        try {
            const usage = await this.getCurrentUsage(userId);
            
            // Get user tier from database (assuming it's stored in users table)
            // For now, default to 'free' - you can modify this based on your user structure
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
                tier: tier
            };
        } catch (error) {
            console.error('❌ Failed to get usage stats:', error);
            
            // Return default stats to prevent crashes
            return {
                questions: { used: 0, limit: 100, percentage: 0 },
                storage: { used: 0, limit: 104857600, percentage: 0, usedMB: 0, limitMB: 100 },
                topics: { used: 0, limit: 5 },
                tier: 'free'
            };
        }
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing usage service database:', err);
                } else {
                    console.log('Usage service database connection closed');
                }
            });
        }
    }
}

module.exports = UsageService;