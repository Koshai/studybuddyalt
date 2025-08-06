// src/server/services/local-user-service.js - Local User Management for Offline Mode
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const SimplifiedDatabaseService = require('./database-simplified');

class LocalUserService {
    constructor() {
        this.baseDataDir = path.join(os.homedir(), 'StudyBuddy');
        this.usersDir = path.join(this.baseDataDir, 'users');
        this.currentUser = null;
        this.userDatabases = new Map(); // Cache for user databases
    }

    /**
     * Initialize the local user system
     */
    async initialize() {
        try {
            // Ensure base directories exist
            await fs.mkdir(this.baseDataDir, { recursive: true });
            await fs.mkdir(this.usersDir, { recursive: true });
            
            console.log(`📁 Local user system initialized at: ${this.baseDataDir}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize local user system:', error);
            return false;
        }
    }

    /**
     * Create a new local user profile
     */
    async createLocalUser(email, firstName, lastName, password) {
        try {
            const userId = crypto.randomUUID();
            const userDir = path.join(this.usersDir, userId);
            
            // Create user directory structure
            await fs.mkdir(userDir, { recursive: true });
            await fs.mkdir(path.join(userDir, 'uploads'), { recursive: true });
            await fs.mkdir(path.join(userDir, 'generated'), { recursive: true });
            await fs.mkdir(path.join(userDir, 'cache'), { recursive: true });
            
            // Hash password (simple for local use)
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            
            // Create user profile
            const userProfile = {
                id: userId,
                email,
                firstName,
                lastName,
                passwordHash: hashedPassword,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                preferences: {
                    aiService: 'ollama', // Default to offline
                    theme: 'light',
                    autoSync: true
                },
                syncSettings: {
                    cloudEnabled: false,
                    cloudUserId: null,
                    lastSync: null
                }
            };
            
            // Save user profile
            const profilePath = path.join(userDir, 'profile.json');
            await fs.writeFile(profilePath, JSON.stringify(userProfile, null, 2));
            
            // Create user's personal database
            const dbPath = path.join(userDir, 'study_data.db');
            const userDb = new SimplifiedDatabaseService(dbPath);
            await userDb.initializeDatabase();
            
            console.log(`👤 Created local user: ${email} (${userId})`);
            return { success: true, userId, userProfile };
            
        } catch (error) {
            console.error('Failed to create local user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Authenticate local user
     */
    async authenticateLocalUser(email, password) {
        try {
            const users = await this.listLocalUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            if (user.passwordHash !== hashedPassword) {
                return { success: false, error: 'Invalid password' };
            }
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            await this.saveUserProfile(user);
            
            // Set as current user
            this.currentUser = user;
            
            console.log(`✅ Local user authenticated: ${email}`);
            return { success: true, user };
            
        } catch (error) {
            console.error('Failed to authenticate local user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all local users
     */
    async listLocalUsers() {
        try {
            const userDirs = await fs.readdir(this.usersDir);
            const users = [];
            
            for (const userDir of userDirs) {
                try {
                    const profilePath = path.join(this.usersDir, userDir, 'profile.json');
                    const profileData = await fs.readFile(profilePath, 'utf8');
                    const profile = JSON.parse(profileData);
                    users.push(profile);
                } catch (error) {
                    console.warn(`Could not load user profile from ${userDir}:`, error.message);
                }
            }
            
            return users;
        } catch (error) {
            console.error('Failed to list local users:', error);
            return [];
        }
    }

    /**
     * Get database service for specific user
     */
    async getUserDatabase(userId) {
        if (this.userDatabases.has(userId)) {
            return this.userDatabases.get(userId);
        }
        
        const userDir = path.join(this.usersDir, userId);
        const dbPath = path.join(userDir, 'study_data.db');
        
        try {
            const userDb = new SimplifiedDatabaseService(dbPath);
            await userDb.initializeDatabase();
            this.userDatabases.set(userId, userDb);
            return userDb;
        } catch (error) {
            console.error(`Failed to get database for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get current user's database
     */
    async getCurrentUserDatabase() {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        return await this.getUserDatabase(this.currentUser.id);
    }

    /**
     * Get user's upload directory
     */
    getUserUploadDir(userId) {
        return path.join(this.usersDir, userId, 'uploads');
    }

    /**
     * Get current user's upload directory
     */
    getCurrentUserUploadDir() {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        return this.getUserUploadDir(this.currentUser.id);
    }

    /**
     * Save user profile
     */
    async saveUserProfile(userProfile) {
        const profilePath = path.join(this.usersDir, userProfile.id, 'profile.json');
        await fs.writeFile(profilePath, JSON.stringify(userProfile, null, 2));
    }

    /**
     * Check if running in offline mode
     */
    isOfflineMode() {
        return this.currentUser !== null;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Logout current user
     */
    logout() {
        this.currentUser = null;
        console.log('👋 User logged out from local mode');
    }

    /**
     * Get user statistics and usage from their local database
     */
    async getUserStats(userId) {
        try {
            const userDb = await this.getUserDatabase(userId);
            
            // Get basic statistics
            const topics = await userDb.getTopics();
            const questions = await userDb.getAllQuestions();
            const sessions = await userDb.getPracticeSessions();
            
            // Calculate storage usage
            const uploadDir = this.getUserUploadDir(userId);
            const storageUsed = await this.calculateDirectorySize(uploadDir);
            
            return {
                totalTopics: topics.length,
                totalQuestions: questions.length,
                totalPracticeSessions: sessions.length,
                storageUsedBytes: storageUsed,
                averageScore: sessions.length > 0 
                    ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length 
                    : 0
            };
        } catch (error) {
            console.error(`Failed to get stats for user ${userId}:`, error);
            return {
                totalTopics: 0,
                totalQuestions: 0,
                totalPracticeSessions: 0,
                storageUsedBytes: 0,
                averageScore: 0
            };
        }
    }

    /**
     * Calculate directory size recursively
     */
    async calculateDirectorySize(dirPath) {
        try {
            let size = 0;
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                if (item.isDirectory()) {
                    size += await this.calculateDirectorySize(itemPath);
                } else {
                    const stats = await fs.stat(itemPath);
                    size += stats.size;
                }
            }
            
            return size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Export user data for backup/migration
     */
    async exportUserData(userId, exportPath) {
        try {
            const userDir = path.join(this.usersDir, userId);
            const userDb = await this.getUserDatabase(userId);
            
            // Export database data
            const exportData = {
                profile: JSON.parse(await fs.readFile(path.join(userDir, 'profile.json'), 'utf8')),
                topics: await userDb.getTopics(),
                questions: await userDb.getAllQuestions(),
                sessions: await userDb.getPracticeSessions(),
                exportedAt: new Date().toISOString()
            };
            
            await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
            console.log(`📤 User data exported to: ${exportPath}`);
            return { success: true };
            
        } catch (error) {
            console.error('Failed to export user data:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = LocalUserService;