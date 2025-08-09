// src/server/app.js - Main Express App Configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import route modules
const authRoutes = require('./routes/auth-routes');
const configRoutes = require('./routes/config-routes');
const subjectRoutes = require('./routes/subject-routes');
const topicRoutes = require('./routes/topic-routes');
const adminRoutes = require('./routes/admin-routes');
const desktopRoutes = require('./routes/desktop-routes');

// Import middleware
const securityMiddleware = require('./middleware/security-middleware');
const rateLimitMiddleware = require('./middleware/rate-limit-middleware');

const app = express();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Trust Railway proxy for rate limiting
if (process.env.RAILWAY_ENVIRONMENT_NAME) {
    app.set('trust proxy', 1);
    console.log('✅ Railway proxy trust enabled');
}

// Security middleware
securityMiddleware.apply(app);

// Rate limiting
rateLimitMiddleware.apply(app);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://www.jaquizy.com', 'https://jaquizy.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// =============================================================================
// ROUTES
// =============================================================================

// API Health check (moved to /api/health)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Jaquizy API Server', 
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Architecture test endpoint
app.get('/api/architecture', async (req, res) => {
    try {
        const EnvironmentService = require('./services/environment-service');
        const ServiceFactory = require('./services/service-factory');
        
        const envConfig = {
            environment: EnvironmentService.getEnvironment(),
            isWeb: EnvironmentService.isWeb(),
            isDesktop: EnvironmentService.isDesktop(),
            aiConfig: EnvironmentService.getAIServiceConfig(),
            storageConfig: EnvironmentService.getStorageServiceConfig(),
            features: EnvironmentService.getFeatureFlags()
        };
        
        const serviceStatus = await ServiceFactory.getServiceStatus();
        
        res.json({
            success: true,
            architecture: 'Web-First + Desktop Download',
            environment: envConfig,
            services: serviceStatus,
            implementation: {
                webMode: {
                    ai: 'OpenAI (primary) + Ollama (fallback)',
                    storage: 'Supabase (only - no SQLite complexity)',
                    features: 'Usage tracking, cloud sync, subscription limits'
                },
                desktopMode: {
                    ai: 'Ollama (local-only)',
                    storage: 'SQLite (local-only)',
                    features: 'Offline-first, privacy-focused, unlimited'
                }
            }
        });
        
    } catch (error) {
        console.error('Architecture test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/desktop', desktopRoutes);

// Static file serving
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message
    });
});

module.exports = app;