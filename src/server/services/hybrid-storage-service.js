// src/server/services/hybrid-storage-service.js
// Hybrid storage system: Supabase (primary) + SQLite (fallback/cache)

const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class HybridStorageService {
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
    }

    initializeTables() {
        // Ensure SQLite tables exist for offline functionality
        const tables = [
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                subscription_tier TEXT DEFAULT 'free',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                synced_at DATETIME,
                is_dirty INTEGER DEFAULT 0
            )`,
            
            `CREATE TABLE IF NOT EXISTS topics (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                subject_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                synced_at DATETIME,
                is_dirty INTEGER DEFAULT 0
            )`,
            
            `CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                topic_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                original_filename TEXT,
                file_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                synced_at DATETIME,
                is_dirty INTEGER DEFAULT 0
            )`,
            
            `CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                topic_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                type TEXT DEFAULT 'multiple_choice',
                options JSON,
                correct_index INTEGER,
                explanation TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                synced_at DATETIME,
                is_dirty INTEGER DEFAULT 0
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_usage (
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
            )`,
            
            `CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id TEXT NOT NULL,
                operation TEXT NOT NULL, -- 'insert', 'update', 'delete'
                data JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                attempts INTEGER DEFAULT 0,
                last_error TEXT
            )`
        ];

        tables.forEach(sql => {
            try {
                this.sqlite.exec(sql);
            } catch (error) {
                console.error('Failed to create table:', error);
            }
        });

        console.log('✅ Hybrid storage tables initialized');
    }

    setupOnlineDetection() {
        // Check Supabase connectivity every 30 seconds
        setInterval(async () => {
            try {
                const { data, error } = await this.supabase
                    .from('user_profiles')
                    .select('id')
                    .limit(1);
                
                const wasOnline = this.isOnline;
                this.isOnline = !error;
                
                if (!wasOnline && this.isOnline) {
                    console.log('🌐 Connection restored - syncing pending changes...');
                    await this.syncPendingChanges();
                } else if (wasOnline && !this.isOnline) {
                    console.log('📴 Connection lost - switching to offline mode');
                }
            } catch (error) {
                this.isOnline = false;
            }
        }, 30000);
    }

    async syncPendingChanges() {
        try {
            const pendingChanges = this.sqlite.prepare(`
                SELECT * FROM sync_queue ORDER BY created_at ASC
            `).all();

            for (const change of pendingChanges) {
                try {
                    await this.executeSyncOperation(change);
                    
                    // Remove from sync queue on success
                    this.sqlite.prepare(`
                        DELETE FROM sync_queue WHERE id = ?
                    `).run(change.id);
                    
                } catch (error) {
                    console.error(`Failed to sync ${change.table_name}:${change.record_id}:`, error);
                    
                    // Update attempts and error
                    this.sqlite.prepare(`
                        UPDATE sync_queue 
                        SET attempts = attempts + 1, last_error = ?
                        WHERE id = ?
                    `).run(error.message, change.id);
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    async executeSyncOperation(change) {
        const { table_name, record_id, operation, data } = change;
        const parsedData = JSON.parse(data);

        switch (operation) {
            case 'insert':
                await this.supabase.from(table_name).insert(parsedData);
                break;
            case 'update':
                await this.supabase.from(table_name).update(parsedData).eq('id', record_id);
                break;
            case 'delete':
                await this.supabase.from(table_name).delete().eq('id', record_id);
                break;
        }
    }

    async addToSyncQueue(tableName, recordId, operation, data) {
        const stmt = this.sqlite.prepare(`
            INSERT INTO sync_queue (table_name, record_id, operation, data)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(tableName, recordId, operation, JSON.stringify(data));
    }

    // ===== TOPIC OPERATIONS =====
    
    async createTopic(userId, subjectId, name, description) {
        const topicId = this.generateId();
        const topicData = {
            id: topicId,
            user_id: userId,
            subject_id: subjectId,
            name,
            description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            if (this.isOnline) {
                // Try Supabase first
                const { data, error } = await this.supabase
                    .from('topics')
                    .insert(topicData)
                    .select()
                    .single();

                if (error) throw error;

                // Cache in SQLite
                this.insertToSQLite('topics', { ...topicData, synced_at: new Date().toISOString() });
                
                return data;
            } else {
                // Offline: store locally and queue for sync
                this.insertToSQLite('topics', { ...topicData, is_dirty: 1 });
                await this.addToSyncQueue('topics', topicId, 'insert', topicData);
                
                return topicData;
            }
        } catch (error) {
            console.error('Failed to create topic in Supabase, falling back to local:', error);
            
            // Fallback to local storage
            this.insertToSQLite('topics', { ...topicData, is_dirty: 1 });
            await this.addToSyncQueue('topics', topicId, 'insert', topicData);
            
            return topicData;
        }
    }

    async getTopics(userId, subjectId) {
        try {
            if (this.isOnline) {
                // Try to get from Supabase first
                const { data, error } = await this.supabase
                    .from('topics')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('subject_id', subjectId)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    // Update local cache
                    data.forEach(topic => {
                        this.upsertToSQLite('topics', { ...topic, synced_at: new Date().toISOString() });
                    });
                    
                    return data;
                }
            }
            
            // Fallback to local data
            const stmt = this.sqlite.prepare(`
                SELECT * FROM topics 
                WHERE user_id = ? AND subject_id = ?
                ORDER BY created_at DESC
            `);
            
            return stmt.all(userId, subjectId);
            
        } catch (error) {
            console.error('Failed to get topics, using local cache:', error);
            
            const stmt = this.sqlite.prepare(`
                SELECT * FROM topics 
                WHERE user_id = ? AND subject_id = ?
                ORDER BY created_at DESC
            `);
            
            return stmt.all(userId, subjectId);
        }
    }

    // ===== FILE STORAGE OPERATIONS =====
    
    async uploadFile(userId, topicId, file, originalFilename) {
        const fileId = this.generateId();
        const fileExtension = path.extname(originalFilename);
        const storageFilename = `${userId}/${topicId}/${fileId}${fileExtension}`;

        try {
            if (this.isOnline) {
                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await this.supabase.storage
                    .from('study-materials')
                    .upload(storageFilename, file, {
                        contentType: file.type || 'application/octet-stream',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = this.supabase.storage
                    .from('study-materials')
                    .getPublicUrl(storageFilename);

                return {
                    fileId,
                    fileUrl: publicUrl,
                    storageFilename,
                    size: file.size
                };
            } else {
                // Offline: store locally
                const localDir = path.join(__dirname, '../../uploads', userId, topicId);
                if (!fs.existsSync(localDir)) {
                    fs.mkdirSync(localDir, { recursive: true });
                }
                
                const localPath = path.join(localDir, `${fileId}${fileExtension}`);
                fs.writeFileSync(localPath, file);

                // Queue for sync when online
                await this.addToSyncQueue('files', fileId, 'upload', {
                    userId,
                    topicId,
                    localPath,
                    storageFilename,
                    originalFilename
                });

                return {
                    fileId,
                    fileUrl: localPath,
                    storageFilename,
                    size: file.size,
                    isLocal: true
                };
            }
        } catch (error) {
            console.error('File upload failed, storing locally:', error);
            
            // Fallback to local storage
            const localDir = path.join(__dirname, '../../uploads', userId, topicId);
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }
            
            const localPath = path.join(localDir, `${fileId}${fileExtension}`);
            fs.writeFileSync(localPath, file);

            await this.addToSyncQueue('files', fileId, 'upload', {
                userId,
                topicId,
                localPath,
                storageFilename,
                originalFilename
            });

            return {
                fileId,
                fileUrl: localPath,
                storageFilename,
                size: file.size,
                isLocal: true
            };
        }
    }

    // ===== UTILITY METHODS =====
    
    insertToSQLite(tableName, data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const stmt = this.sqlite.prepare(`
            INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})
        `);
        
        return stmt.run(...values);
    }

    upsertToSQLite(tableName, data) {
        return this.insertToSQLite(tableName, data);
    }

    generateId() {
        return require('crypto').randomUUID();
    }

    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            pendingSync: this.sqlite.prepare('SELECT COUNT(*) as count FROM sync_queue').get().count
        };
    }
}

module.exports = HybridStorageService;