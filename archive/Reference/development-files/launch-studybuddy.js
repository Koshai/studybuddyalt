#!/usr/bin/env node
// StudyBuddy Desktop Launcher - Cross-platform launcher script

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

class StudyBuddyLauncher {
    constructor() {
        this.appDir = __dirname;
        this.defaultPort = 3001;
        this.maxPort = 3010;
        this.serverProcess = null;
        this.availablePort = null;
    }

    /**
     * Find an available port
     */
    async findAvailablePort() {
        for (let port = this.defaultPort; port <= this.maxPort; port++) {
            if (await this.isPortFree(port)) {
                this.availablePort = port;
                return port;
            }
        }
        throw new Error(`No available ports found between ${this.defaultPort}-${this.maxPort}`);
    }

    /**
     * Check if port is free
     */
    isPortFree(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const server = net.createServer();
            
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            
            server.on('error', () => resolve(false));
        });
    }

    /**
     * Check if StudyBuddy server is already running
     */
    async checkIfRunning() {
        try {
            const response = await fetch(`http://localhost:${this.defaultPort}/api/setup/offline/status`);
            if (response.ok) {
                console.log('✅ StudyBuddy server already running on port', this.defaultPort);
                this.availablePort = this.defaultPort;
                return true;
            }
        } catch (error) {
            // Server not running on default port
        }
        return false;
    }

    /**
     * Start the StudyBuddy server
     */
    async startServer() {
        try {
            console.log('🚀 Starting StudyBuddy server...');
            
            // Check if already running
            if (await this.checkIfRunning()) {
                return this.availablePort;
            }

            // Find available port
            const port = await this.findAvailablePort();
            console.log(`📡 Using port: ${port}`);

            // Set environment variables
            process.env.PORT = port;
            process.env.STUDYBUDDY_DESKTOP_MODE = 'true';

            // Start server
            this.serverProcess = spawn('node', ['src/server/index.js'], {
                cwd: this.appDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, PORT: port }
            });

            // Handle server output
            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Server running')) {
                    console.log('✅ Server started successfully!');
                }
                // Log server output (optional for debugging)
                // console.log('Server:', output.trim());
            });

            this.serverProcess.stderr.on('data', (data) => {
                console.error('Server Error:', data.toString());
            });

            this.serverProcess.on('close', (code) => {
                console.log(`Server stopped with code ${code}`);
                process.exit(code);
            });

            // Wait for server to start
            await this.waitForServer(port);
            return port;

        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            throw error;
        }
    }

    /**
     * Wait for server to be ready
     */
    async waitForServer(port, maxWait = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            try {
                const response = await fetch(`http://localhost:${port}/api/setup/offline/status`);
                if (response.ok) {
                    return true;
                }
            } catch (error) {
                // Server not ready yet
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Server failed to start within timeout period');
    }

    /**
     * Open browser to StudyBuddy
     */
    async openBrowser(port) {
        const url = `http://localhost:${port}`;
        console.log(`🌐 Opening StudyBuddy at: ${url}`);

        const platform = os.platform();
        let command;

        switch (platform) {
            case 'darwin': // macOS
                command = `open "${url}"`;
                break;
            case 'win32': // Windows
                command = `start "" "${url}"`;
                break;
            default: // Linux and others
                command = `xdg-open "${url}"`;
                break;
        }

        exec(command, (error) => {
            if (error) {
                console.log(`❌ Could not open browser automatically: ${error.message}`);
                console.log(`🔗 Please open your browser and go to: ${url}`);
            }
        });
    }

    /**
     * Create desktop shortcut
     */
    async createDesktopShortcut() {
        const platform = os.platform();
        const desktopPath = path.join(os.homedir(), 'Desktop');
        
        try {
            switch (platform) {
                case 'win32':
                    await this.createWindowsShortcut(desktopPath);
                    break;
                case 'darwin':
                    await this.createMacShortcut(desktopPath);
                    break;
                case 'linux':
                    await this.createLinuxShortcut(desktopPath);
                    break;
            }
            console.log('🖱️  Desktop shortcut created!');
        } catch (error) {
            console.log('⚠️  Could not create desktop shortcut:', error.message);
        }
    }

    /**
     * Windows shortcut creation
     */
    async createWindowsShortcut(desktopPath) {
        const shortcutPath = path.join(desktopPath, 'StudyBuddy.lnk');
        const batPath = path.join(this.appDir, 'StudyBuddy.bat');
        
        // Create VBS script to create shortcut
        const vbsScript = `
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "${shortcutPath}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "${batPath}"
oLink.WorkingDirectory = "${this.appDir}"
oLink.Description = "StudyBuddy AI Study Assistant"
oLink.IconLocation = "${batPath},0"
oLink.Save
        `.trim();
        
        const vbsPath = path.join(this.appDir, 'create_shortcut.vbs');
        fs.writeFileSync(vbsPath, vbsScript);
        
        return new Promise((resolve, reject) => {
            exec(`cscript "${vbsPath}"`, (error) => {
                fs.unlinkSync(vbsPath); // Clean up
                if (error) reject(error);
                else resolve();
            });
        });
    }

    /**
     * macOS shortcut creation
     */
    async createMacShortcut(desktopPath) {
        const appPath = path.join(desktopPath, 'StudyBuddy.app');
        const launcherPath = path.join(this.appDir, 'launch-studybuddy.js');
        
        // Create app bundle structure
        const contentsDir = path.join(appPath, 'Contents');
        const macOSDir = path.join(contentsDir, 'MacOS');
        
        fs.mkdirSync(macOSDir, { recursive: true });
        
        // Create Info.plist
        const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>StudyBuddy</string>
    <key>CFBundleExecutable</key>
    <string>StudyBuddy</string>
    <key>CFBundleIdentifier</key>
    <string>com.studybuddy.app</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
</dict>
</plist>`;
        
        fs.writeFileSync(path.join(contentsDir, 'Info.plist'), infoPlist);
        
        // Create executable script
        const execScript = `#!/bin/bash
cd "${this.appDir}"
node "${launcherPath}"`;
        
        const execPath = path.join(macOSDir, 'StudyBuddy');
        fs.writeFileSync(execPath, execScript);
        fs.chmodSync(execPath, '755');
    }

    /**
     * Linux shortcut creation
     */
    async createLinuxShortcut(desktopPath) {
        const shortcutPath = path.join(desktopPath, 'StudyBuddy.desktop');
        const launcherPath = path.join(this.appDir, 'launch-studybuddy.js');
        
        const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=StudyBuddy
Comment=AI Study Assistant
Exec=node "${launcherPath}"
Path=${this.appDir}
Icon=applications-education
Terminal=false
Categories=Education;
`;
        
        fs.writeFileSync(shortcutPath, desktopEntry);
        fs.chmodSync(shortcutPath, '755');
    }

    /**
     * Handle graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = () => {
            console.log('\n🛑 Shutting down StudyBuddy...');
            if (this.serverProcess) {
                this.serverProcess.kill('SIGTERM');
                setTimeout(() => {
                    if (!this.serverProcess.killed) {
                        this.serverProcess.kill('SIGKILL');
                    }
                }, 5000);
            }
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('exit', () => {
            if (this.serverProcess) {
                this.serverProcess.kill();
            }
        });
    }

    /**
     * Main launch function
     */
    async launch() {
        try {
            console.log('');
            console.log('='.repeat(50));
            console.log('   📚 StudyBuddy - AI Study Assistant');
            console.log('   🚀 Starting desktop application...');
            console.log('='.repeat(50));
            console.log('');

            this.setupGracefulShutdown();

            // Start server
            const port = await this.startServer();

            // Open browser
            await this.openBrowser(port);

            // Create desktop shortcut on first run
            const shortcutFlagPath = path.join(this.appDir, '.desktop_shortcut_created');
            if (!fs.existsSync(shortcutFlagPath)) {
                await this.createDesktopShortcut();
                fs.writeFileSync(shortcutFlagPath, 'created');
            }

            console.log('');
            console.log('✅ StudyBuddy is now running!');
            console.log(`🌐 URL: http://localhost:${port}`);
            console.log('📝 Press Ctrl+C to stop the server');
            console.log('');

            // Keep the process alive
            process.stdin.resume();

        } catch (error) {
            console.error('❌ Failed to launch StudyBuddy:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const launcher = new StudyBuddyLauncher();
    launcher.launch();
}

module.exports = StudyBuddyLauncher;