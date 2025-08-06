// src/server/services/offline-setup-service.js - Automatic Offline Setup Service
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const os = require('os');
const LocalUserService = require('./local-user-service');

class OfflineSetupService {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        this.setupInProgress = false;
        this.setupCallbacks = new Map();
        this.localUserService = new LocalUserService();
    }

    /**
     * Check if Ollama is already installed
     */
    async checkOllamaInstalled() {
        return new Promise((resolve) => {
            exec('ollama --version', (error, stdout) => {
                if (error) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Get system information for compatibility check
     */
    async getSystemInfo() {
        const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
        const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024)); // GB
        
        // Get available disk space (simplified)
        let availableStorage = 100; // Default fallback
        try {
            const stats = await fs.stat(os.homedir());
            // This is a simplified calculation - in production you'd use a proper disk space library
            availableStorage = 50; // Placeholder
        } catch (error) {
            console.warn('Could not determine disk space:', error.message);
        }

        return {
            platform: os.platform(),
            arch: os.arch(),
            totalMemoryGB: totalMem,
            freeMemoryGB: freeMem,
            availableStorageGB: availableStorage,
            isCompatible: this.isWindows || os.platform() === 'darwin' || os.platform() === 'linux'
        };
    }

    /**
     * Check system requirements for Ollama
     */
    async checkSystemRequirements() {
        const systemInfo = await this.getSystemInfo();
        
        const requirements = {
            minimumMemoryGB: 4,
            recommendedMemoryGB: 8,
            minimumStorageGB: 10,
            recommendedStorageGB: 20
        };

        const checks = {
            memory: systemInfo.totalMemoryGB >= requirements.minimumMemoryGB,
            storage: systemInfo.availableStorageGB >= requirements.minimumStorageGB,
            platform: systemInfo.isCompatible,
            meets_recommended: systemInfo.totalMemoryGB >= requirements.recommendedMemoryGB && 
                              systemInfo.availableStorageGB >= requirements.recommendedStorageGB
        };

        return {
            systemInfo,
            requirements,
            checks,
            canInstall: checks.memory && checks.storage && checks.platform
        };
    }

    /**
     * Download file with progress tracking
     */
    async downloadFile(url, destinationPath, onProgress) {
        return new Promise((resolve, reject) => {
            const file = require('fs').createWriteStream(destinationPath);
            
            https.get(url, (response) => {
                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (onProgress && totalSize) {
                        const progress = Math.round((downloadedSize / totalSize) * 100);
                        onProgress(progress);
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close(resolve);
                });

                file.on('error', (err) => {
                    fs.unlink(destinationPath);
                    reject(err);
                });

            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Install Ollama automatically
     */
    async installOllama(progressCallback) {
        if (this.setupInProgress) {
            throw new Error('Installation already in progress');
        }

        this.setupInProgress = true;
        
        try {
            // Step 1: Check if already installed
            progressCallback?.({ step: 'checking', progress: 10 });
            const alreadyInstalled = await this.checkOllamaInstalled();
            if (alreadyInstalled) {
                progressCallback?.({ step: 'already_installed', progress: 100 });
                return { success: true, message: 'Ollama is already installed' };
            }

            // Step 2: Download Ollama installer
            progressCallback?.({ step: 'downloading', progress: 20 });
            const downloadsDir = path.join(os.homedir(), 'Downloads');
            const installerPath = path.join(downloadsDir, 'OllamaSetup.exe');
            
            const downloadUrl = 'https://ollama.com/download/OllamaSetup.exe';
            
            await this.downloadFile(downloadUrl, installerPath, (progress) => {
                progressCallback?.({ step: 'downloading', progress: 20 + (progress * 0.3) });
            });

            // Step 3: Run installer
            progressCallback?.({ step: 'installing', progress: 60 });
            await this.runInstaller(installerPath, progressCallback);

            // Step 4: Wait for installation to complete
            progressCallback?.({ step: 'waiting', progress: 80 });
            await this.waitForOllamaService();

            // Step 5: Initialize local user system
            progressCallback?.({ step: 'initializing_local_system', progress: 85 });
            await this.localUserService.initialize();

            // Step 6: Download a basic model
            progressCallback?.({ step: 'downloading_model', progress: 90 });
            await this.downloadBasicModel(progressCallback);

            progressCallback?.({ step: 'completed', progress: 100 });
            
            return { 
                success: true, 
                message: 'Offline mode setup completed successfully' 
            };

        } catch (error) {
            console.error('Ollama installation failed:', error);
            return { 
                success: false, 
                error: error.message 
            };
        } finally {
            this.setupInProgress = false;
        }
    }

    /**
     * Run the Ollama installer
     */
    async runInstaller(installerPath, progressCallback) {
        return new Promise((resolve, reject) => {
            // Run installer silently
            const installer = spawn(installerPath, ['/S'], {
                detached: true,
                stdio: 'pipe'
            });

            let installationComplete = false;

            installer.on('close', (code) => {
                if (code === 0) {
                    installationComplete = true;
                    resolve();
                } else {
                    reject(new Error(`Installer exited with code ${code}`));
                }
            });

            installer.on('error', (error) => {
                reject(error);
            });

            // Monitor installation progress (simplified)
            const progressInterval = setInterval(() => {
                if (installationComplete) {
                    clearInterval(progressInterval);
                    return;
                }
                
                // Simulate progress - in reality, you'd monitor the actual installation
                const currentProgress = Math.min(progressCallback?.lastProgress || 60, 75);
                progressCallback?.({ step: 'installing', progress: currentProgress + 1 });
            }, 1000);
        });
    }

    /**
     * Wait for Ollama service to be available
     */
    async waitForOllamaService(maxWaitTime = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                // Try to connect to Ollama service
                const response = await fetch('http://localhost:11434/api/version');
                if (response.ok) {
                    return true;
                }
            } catch (error) {
                // Service not ready yet
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Ollama service did not start within expected time');
    }

    /**
     * Download a basic model for question generation
     */
    async downloadBasicModel(progressCallback) {
        return new Promise((resolve, reject) => {
            // Download a lightweight model suitable for question generation
            const modelProcess = spawn('ollama', ['pull', 'llama3.2:1b'], {
                stdio: 'pipe'
            });

            let output = '';

            modelProcess.stdout.on('data', (data) => {
                output += data.toString();
                // Parse progress from Ollama output
                const progressMatch = output.match(/(\d+)%/);
                if (progressMatch) {
                    const progress = parseInt(progressMatch[1]);
                    progressCallback?.({ step: 'downloading_model', progress: 90 + (progress * 0.1) });
                }
            });

            modelProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Model download failed with code ${code}`));
                }
            });

            modelProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Test the offline installation
     */
    async testOfflineInstallation() {
        try {
            // Test basic Ollama functionality
            const response = await fetch('http://localhost:11434/api/version');
            if (!response.ok) {
                throw new Error('Ollama service not responding');
            }

            // Test model availability
            const modelsResponse = await fetch('http://localhost:11434/api/tags');
            const models = await modelsResponse.json();
            
            if (!models.models || models.models.length === 0) {
                throw new Error('No models available');
            }

            return {
                success: true,
                version: await response.json(),
                models: models.models.map(m => m.name)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get installation status
     */
    async getInstallationStatus() {
        const isInstalled = await this.checkOllamaInstalled();
        if (!isInstalled) {
            return { status: 'not_installed' };
        }

        const testResult = await this.testOfflineInstallation();
        if (testResult.success) {
            return { 
                status: 'ready',
                models: testResult.models,
                version: testResult.version
            };
        } else {
            return { 
                status: 'installed_but_not_working',
                error: testResult.error
            };
        }
    }

    /**
     * Setup offline user account
     */
    async setupOfflineUser(email, firstName, lastName, password) {
        try {
            await this.localUserService.initialize();
            const result = await this.localUserService.createLocalUser(email, firstName, lastName, password);
            
            if (result.success) {
                console.log(`✅ Offline user created: ${email}`);
                return {
                    success: true,
                    userId: result.userId,
                    message: 'Offline user account created successfully'
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to setup offline user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if local user system is initialized
     */
    async checkLocalUserSystem() {
        try {
            const users = await this.localUserService.listLocalUsers();
            return {
                initialized: true,
                userCount: users.length,
                users: users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName }))
            };
        } catch (error) {
            return {
                initialized: false,
                error: error.message
            };
        }
    }
}

module.exports = OfflineSetupService;