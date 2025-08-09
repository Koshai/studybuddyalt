// desktop-template/server/desktop-server.js - Local server for desktop app
const express = require('express');
const path = require('path');
const cors = require('cors');

// Force desktop environment
process.env.STUDYBUDDY_MODE = 'desktop';
process.env.NODE_ENV = 'production';

// Import the main app configuration
// We'll copy the entire src folder to the desktop template
const app = require('../../src/server/app');

// Override some routes for desktop-specific behavior
const desktopRoutes = express.Router();

// Desktop-specific health check
desktopRoutes.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mode: 'desktop',
        timestamp: new Date().toISOString(),
        platform: process.platform,
        offline: true
    });
});

// Desktop-specific user export
desktopRoutes.get('/export/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get the service factory for desktop environment
        const ServiceFactory = require('../../src/server/services/service-factory');
        const storage = ServiceFactory.getStorageService();
        
        // Export user data
        const userData = await storage.exportDataForUser(userId);
        
        res.json({
            success: true,
            data: userData,
            exportDate: new Date().toISOString(),
            mode: 'desktop'
        });
    } catch (error) {
        console.error('Desktop export error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Desktop-specific service status
desktopRoutes.get('/desktop/status', async (req, res) => {
    try {
        const ServiceFactory = require('../../src/server/services/service-factory');
        const status = await ServiceFactory.getServiceStatus();
        
        res.json({
            ...status,
            mode: 'desktop',
            features: {
                offline: true,
                ollama: true,
                unlimited: true,
                privacy: true
            }
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Add desktop routes to the main app
app.use('/api/desktop', desktopRoutes);

// Start the server
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, 'localhost', () => {
    console.log('🖥️  StudyBuddy Desktop Server started');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: desktop`);
    console.log(`📂 Mode: offline-first`);
    console.log('─'.repeat(50));
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('📴 Desktop server shutting down...');
    server.close(() => {
        console.log('✅ Desktop server stopped');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 Desktop server interrupted...');
    server.close(() => {
        console.log('✅ Desktop server stopped');
        process.exit(0);
    });
});

module.exports = server;