// desktop-template/main.js - Electron Main Process for Desktop App
const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

// Set environment to desktop mode
process.env.STUDYBUDDY_MODE = 'desktop';
process.env.NODE_ENV = 'production';

class StudyBuddyDesktopApp {
    constructor() {
        this.mainWindow = null;
        this.localServer = null;
        this.serverProcess = null;
        this.isQuitting = false;
        
        console.log('🖥️  Jaquizy Desktop App initializing...');
    }

    async initialize() {
        // Set app properties
        app.setName('Jaquizy');
        app.setAppUserModelId('com.studybuddy.app');

        // Handle app events
        app.whenReady().then(() => this.createWindow());
        app.on('window-all-closed', () => this.handleWindowAllClosed());
        app.on('activate', () => this.handleActivate());
        app.on('before-quit', () => this.handleBeforeQuit());

        // Start local server
        await this.startLocalServer();
        
        // Setup IPC handlers
        this.setupIPCHandlers();
        
        // Create app menu
        this.createMenu();
    }

    async startLocalServer() {
        const serverPath = path.join(__dirname, 'server', 'desktop-server.js');
        
        return new Promise((resolve, reject) => {
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    PORT: '3001',
                    STUDYBUDDY_MODE: 'desktop'
                }
            });

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Server:', output);
                
                if (output.includes('Server running')) {
                    console.log('✅ Local server started successfully');
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                console.error('Server Error:', data.toString());
            });

            this.serverProcess.on('close', (code) => {
                console.log(`Server process exited with code ${code}`);
                if (!this.isQuitting) {
                    this.showErrorDialog('Server Stopped', 'The local server has stopped unexpectedly.');
                }
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (this.serverProcess && this.serverProcess.exitCode === null) {
                    reject(new Error('Server startup timeout'));
                }
            }, 10000);
        });
    }

    createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, 'assets', 'icon.png'),
            show: false, // Don't show until ready
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
        });

        // Load the app
        this.mainWindow.loadURL('http://localhost:3001');

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            console.log('✅ StudyBuddy Desktop App ready');
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });

        // Development tools
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
    }

    setupIPCHandlers() {
        // Handle file dialogs
        ipcMain.handle('show-open-dialog', async (event, options) => {
            const result = await dialog.showOpenDialog(this.mainWindow, options);
            return result;
        });

        ipcMain.handle('show-save-dialog', async (event, options) => {
            const result = await dialog.showSaveDialog(this.mainWindow, options);
            return result;
        });

        // Handle app information
        ipcMain.handle('get-app-info', () => {
            return {
                name: app.getName(),
                version: app.getVersion(),
                platform: process.platform,
                isDesktop: true,
                userDataPath: app.getPath('userData')
            };
        });

        // Handle data export
        ipcMain.handle('export-user-data', async (event, userId) => {
            try {
                // This will be handled by the desktop server
                const response = await fetch(`http://localhost:3001/api/export/${userId}`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Export failed:', error);
                throw error;
            }
        });
    }

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Export Data',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => {
                            this.mainWindow.webContents.send('menu-export-data');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: process.platform === 'darwin' ? 'Close' : 'Exit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+W' : 'Ctrl+Q',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                    { type: 'separator' },
                    { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                    { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                    { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                    { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                    { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
                    { type: 'separator' },
                    { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                    { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                    { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                    { type: 'separator' },
                    { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
                    { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About StudyBuddy',
                        click: () => {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'About StudyBuddy',
                                message: 'StudyBuddy Desktop',
                                detail: `Version: ${app.getVersion()}\nAI-powered study platform for offline learning`
                            });
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    handleWindowAllClosed() {
        if (process.platform !== 'darwin') {
            this.cleanup();
            app.quit();
        }
    }

    handleActivate() {
        if (BrowserWindow.getAllWindows().length === 0) {
            this.createWindow();
        }
    }

    handleBeforeQuit() {
        this.isQuitting = true;
        this.cleanup();
    }

    cleanup() {
        console.log('🧹 Cleaning up...');
        
        if (this.serverProcess) {
            console.log('Stopping local server...');
            this.serverProcess.kill();
            this.serverProcess = null;
        }
    }

    showErrorDialog(title, content) {
        if (this.mainWindow) {
            dialog.showErrorBox(title, content);
        }
    }
}

// Create and initialize the app
const desktopApp = new StudyBuddyDesktopApp();
desktopApp.initialize().catch(error => {
    console.error('Failed to initialize desktop app:', error);
    app.quit();
});