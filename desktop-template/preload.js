// desktop-template/preload.js - Electron Preload Script
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App information
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    
    // File system operations
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    
    // Data operations
    exportUserData: (userId) => ipcRenderer.invoke('export-user-data', userId),
    
    // Menu events
    onMenuExportData: (callback) => {
        ipcRenderer.on('menu-export-data', () => callback());
    },
    
    // Cleanup listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// Expose environment detection to the web app
contextBridge.exposeInMainWorld('studyBuddyDesktop', {
    isDesktop: true,
    platform: process.platform,
    version: process.env.npm_package_version || '1.0.0'
});

console.log('✅ StudyBuddy Desktop preload script loaded');