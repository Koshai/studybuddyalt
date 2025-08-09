// src/server/services/desktop-app-builder.js - Personalized Desktop App Generator
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const EnvironmentService = require('./environment-service');
const ServiceFactory = require('./service-factory');

class DesktopAppBuilder {
    constructor() {
        this.templatePath = path.join(__dirname, '../../../desktop-template');
        this.buildPath = path.join(__dirname, '../../../builds');
        this.distPath = path.join(__dirname, '../../../dist-desktop');
        
        console.log('🏗️  Desktop App Builder initialized');
    }

    /**
     * Generate a personalized desktop app for a user
     */
    async generatePersonalizedApp(userId, userTier = 'pro', options = {}) {
        const buildId = uuidv4();
        const buildDir = path.join(this.buildPath, buildId);
        
        console.log(`🏗️  Building personalized desktop app for user: ${userId}`);
        console.log(`📦 Build ID: ${buildId}`);
        
        try {
            // Step 1: Create build directory
            await this.createBuildDirectory(buildDir);
            
            // Step 2: Copy template files
            await this.copyTemplateFiles(buildDir);
            
            // Step 3: Copy application source
            await this.copyApplicationSource(buildDir);
            
            // Step 4: Export and embed user data
            await this.embedUserData(buildDir, userId);
            
            // Step 5: Configure for user tier
            await this.configureForTier(buildDir, userTier, options);
            
            // Step 6: Create user-specific configuration
            await this.createUserConfiguration(buildDir, userId, userTier);
            
            // Step 7: Build the executable
            const executablePath = await this.buildExecutable(buildDir, buildId);
            
            console.log(`✅ Desktop app built successfully: ${executablePath}`);
            
            return {
                buildId,
                executablePath,
                size: await this.getDirectorySize(buildDir),
                userTier,
                features: this.getTierFeatures(userTier)
            };
            
        } catch (error) {
            console.error(`❌ Desktop app build failed:`, error);
            
            // Cleanup on failure
            await this.cleanup(buildDir);
            
            throw new Error(`Desktop app generation failed: ${error.message}`);
        }
    }

    /**
     * Create the build directory structure
     */
    async createBuildDirectory(buildDir) {
        await fs.ensureDir(buildDir);
        await fs.ensureDir(path.join(buildDir, 'data'));
        await fs.ensureDir(path.join(buildDir, 'assets'));
        await fs.ensureDir(path.join(buildDir, 'src'));
        
        console.log(`📁 Build directory created: ${buildDir}`);
    }

    /**
     * Copy template files to build directory
     */
    async copyTemplateFiles(buildDir) {
        const templateFiles = [
            'main.js',
            'preload.js',
            'package.json'
        ];
        
        for (const file of templateFiles) {
            const sourcePath = path.join(this.templatePath, file);
            const targetPath = path.join(buildDir, file);
            
            if (await fs.pathExists(sourcePath)) {
                await fs.copy(sourcePath, targetPath);
                console.log(`📄 Copied template file: ${file}`);
            }
        }
        
        // Copy server directory
        const serverDir = path.join(this.templatePath, 'server');
        if (await fs.pathExists(serverDir)) {
            await fs.copy(serverDir, path.join(buildDir, 'server'));
            console.log(`📁 Copied server directory`);
        }
    }

    /**
     * Copy application source code
     */
    async copyApplicationSource(buildDir) {
        const sourcePath = path.join(__dirname, '../../../src');
        const targetPath = path.join(buildDir, 'src');
        
        // Copy the entire src directory
        await fs.copy(sourcePath, targetPath, {
            filter: (src) => {
                // Skip node_modules and other unnecessary files
                return !src.includes('node_modules') && 
                       !src.includes('.git') && 
                       !src.includes('dist');
            }
        });
        
        console.log(`📦 Copied application source`);
    }

    /**
     * Export user data and embed it in the desktop app
     */
    async embedUserData(buildDir, userId) {
        try {
            // Get user data using the storage service
            const storage = ServiceFactory.getStorageService();
            const userData = await storage.exportDataForUser(userId);
            
            // Create user-specific database
            const userDbPath = path.join(buildDir, 'data', 'user_data.db');
            await this.createUserDatabase(userDbPath, userData);
            
            // Save user metadata
            const userMetadata = {
                userId,
                exportDate: new Date().toISOString(),
                version: '2.0-desktop',
                totalTopics: userData.topics?.length || 0,
                totalNotes: userData.notes?.length || 0,
                totalQuestions: userData.questions?.length || 0
            };
            
            await fs.writeJson(
                path.join(buildDir, 'data', 'user_metadata.json'),
                userMetadata,
                { spaces: 2 }
            );
            
            console.log(`👤 Embedded user data: ${userMetadata.totalTopics} topics, ${userMetadata.totalNotes} notes, ${userMetadata.totalQuestions} questions`);
            
        } catch (error) {
            console.error('Failed to embed user data:', error);
            throw error;
        }
    }

    /**
     * Create a SQLite database with user data
     */
    async createUserDatabase(dbPath, userData) {
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        
        try {
            // Create tables (reuse the simplified database schema)
            const SimplifiedDatabaseService = require('./database-simplified');
            const dbService = new SimplifiedDatabaseService();
            
            // Copy table creation logic
            // This would involve creating all the necessary tables
            // and inserting the user's data
            
            // For now, create a basic structure
            db.exec(`
                CREATE TABLE IF NOT EXISTS user_info (
                    id TEXT PRIMARY KEY,
                    data TEXT
                );
            `);
            
            db.prepare(`
                INSERT INTO user_info (id, data) VALUES (?, ?)
            `).run('user_data', JSON.stringify(userData));
            
            console.log(`💾 Created user database: ${dbPath}`);
            
        } finally {
            db.close();
        }
    }

    /**
     * Configure app for specific tier (free, pro, etc.)
     */
    async configureForTier(buildDir, userTier, options) {
        const tierConfig = this.getTierFeatures(userTier);
        
        // Create tier configuration file
        await fs.writeJson(
            path.join(buildDir, 'data', 'tier_config.json'),
            {
                tier: userTier,
                features: tierConfig,
                customOptions: options
            },
            { spaces: 2 }
        );
        
        console.log(`🎯 Configured for tier: ${userTier}`);
    }

    /**
     * Create user-specific configuration
     */
    async createUserConfiguration(buildDir, userId, userTier) {
        const config = {
            app: {
                name: 'StudyBuddy Desktop',
                version: '1.0.0',
                mode: 'desktop'
            },
            user: {
                id: userId,
                tier: userTier
            },
            features: this.getTierFeatures(userTier),
            database: {
                path: './data/user_data.db',
                type: 'sqlite'
            },
            ai: {
                service: 'ollama',
                modelsPath: './models',
                fallback: null // Desktop doesn't need fallback
            }
        };
        
        await fs.writeJson(
            path.join(buildDir, 'data', 'app_config.json'),
            config,
            { spaces: 2 }
        );
        
        console.log(`⚙️  Created user configuration`);
    }

    /**
     * Build the executable using electron-builder
     */
    async buildExecutable(buildDir, buildId) {
        return new Promise((resolve, reject) => {
            const buildProcess = spawn('npm', ['run', 'build'], {
                cwd: buildDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let errorOutput = '';
            
            buildProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log('Build:', text.trim());
            });
            
            buildProcess.stderr.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                console.error('Build Error:', text.trim());
            });
            
            buildProcess.on('close', (code) => {
                if (code === 0) {
                    // Find the generated executable
                    const executablePath = path.join(this.distPath, buildId);
                    resolve(executablePath);
                } else {
                    reject(new Error(`Build process failed with code ${code}: ${errorOutput}`));
                }
            });
            
            buildProcess.on('error', (error) => {
                reject(new Error(`Failed to start build process: ${error.message}`));
            });
        });
    }

    /**
     * Get features available for a tier
     */
    getTierFeatures(tier) {
        const features = {
            free: {
                questionsPerMonth: 100,
                storage: '100MB',
                ollama: 'basic', // Smaller models
                sync: false,
                priority: false
            },
            pro: {
                questionsPerMonth: 1000,
                storage: '1GB',
                ollama: 'full', // All models
                sync: true,
                priority: true
            },
            premium: {
                questionsPerMonth: 'unlimited',
                storage: 'unlimited',
                ollama: 'full',
                sync: true,
                priority: true,
                customization: true
            }
        };
        
        return features[tier] || features.free;
    }

    /**
     * Get directory size in bytes
     */
    async getDirectorySize(dirPath) {
        let size = 0;
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
                size += await this.getDirectorySize(itemPath);
            } else {
                size += stats.size;
            }
        }
        
        return size;
    }

    /**
     * Cleanup build directory
     */
    async cleanup(buildDir) {
        try {
            if (await fs.pathExists(buildDir)) {
                await fs.remove(buildDir);
                console.log(`🧹 Cleaned up build directory: ${buildDir}`);
            }
        } catch (error) {
            console.warn(`⚠️  Failed to cleanup build directory: ${error.message}`);
        }
    }

    /**
     * List available builds
     */
    async listBuilds() {
        try {
            const builds = await fs.readdir(this.distPath);
            return builds.filter(build => !build.startsWith('.'));
        } catch (error) {
            return [];
        }
    }
}

module.exports = DesktopAppBuilder;