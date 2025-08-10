// src/main.js - Electron Main Process
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '../assets/icon.png'), // Add your app icon
    show: false
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Subject',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-subject');
          }
        },
        {
          label: 'Upload Material',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            mainWindow.webContents.send('menu-upload');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Study',
      submenu: [
        {
          label: 'Practice Questions',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-practice');
          }
        },
        {
          label: 'Generate Questions',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow.webContents.send('menu-generate');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'AI Models',
      submenu: [
        {
          label: 'Check Ollama Status',
          click: () => {
            mainWindow.webContents.send('menu-check-ollama');
          }
        },
        {
          label: 'Download Models',
          click: () => {
            mainWindow.webContents.send('menu-download-models');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Offline Study AI',
          click: () => {
            mainWindow.webContents.send('menu-about');
          }
        },
        {
          label: 'Setup Guide',
          click: () => {
            mainWindow.webContents.send('menu-setup');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startServer() {
  if (isDev) {
    console.log('Development mode - server should be started separately');
    return;
  }

  // In production, start the backend server with ServiceFactory architecture
  const serverPath = path.join(__dirname, 'server', 'server.js');
  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, PORT: 3001, STUDYBUDDY_MODE: 'desktop' }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// App event handlers
app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});

// Handle app crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  stopServer();
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});