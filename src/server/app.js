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
const notesRoutes = require('./routes/notes-routes');
const practiceRoutes = require('./routes/practice-routes');
const adminRoutes = require('./routes/admin-routes');
const desktopRoutes = require('./routes/desktop-routes');
const userRoutes = require('./routes/user-routes');
const dashboardRoutes = require('./routes/dashboard-routes');
const flashcardRoutes = require('./routes/flashcard-routes');
const uploadRoutes = require('./routes/upload-routes');
const feedbackRoutes = require('./routes/feedback-routes');

// Import middleware
const securityMiddleware = require('./middleware/security-middleware');
const rateLimitMiddleware = require('./middleware/rate-limit-middleware');
const requestContextMiddleware = require('./middleware/request-context-middleware');
const apiResponseMiddleware = require('./middleware/api-response-middleware');

const app = express();
const authMiddleware = require('./middleware/auth-middleware');

const requireDevelopment = (req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({ error: 'Not found' });
    }
    next();
};

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

// Request context (request IDs) and API response helpers
requestContextMiddleware.apply(app);
apiResponseMiddleware.apply(app);

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

// Lightweight request log with request ID for traceability
app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        console.log(`[${req.requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
    });
    next();
});

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

// Architecture test endpoint (development only)
app.get('/api/architecture', requireDevelopment, async (req, res) => {
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
app.use('/api/notes', notesRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/desktop', desktopRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', dashboardRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api', uploadRoutes);
app.use('/api/feedback', feedbackRoutes);

// Missing routes that return HTML instead of JSON - add stubs
app.get('/api/setup/offline/status', (req, res) => {
    res.json({
        success: true,
        status: 'not_installed',
        message: 'Offline mode not available in web deployment'
    });
});

app.get('/api/setup/offline/test', requireDevelopment, (req, res) => {
    res.json({
        success: false,
        message: 'Offline mode not available in web deployment'
    });
});

app.get('/api/admin/sync/status', authMiddleware.authenticateToken, authMiddleware.requireAdmin, (req, res) => {
    res.json({
        success: true,
        status: {
            supabase: { connected: true, lastSync: new Date().toISOString() },
            sqlite: null // Not available in web mode
        }
    });
});

app.get('/api/admin/sync/logs', authMiddleware.authenticateToken, authMiddleware.requireAdmin, (req, res) => {
    res.json({
        success: true,
        logs: [
            { timestamp: new Date().toISOString(), level: 'info', message: 'Web-only mode active, no sync needed' }
        ]
    });
});

app.get('/api/user/settings', authMiddleware.authenticateToken, (req, res) => {
    res.json({
        success: true,
        settings: {
            theme: 'light',
            notifications: true,
            language: 'en'
        }
    });
});


// Health check routes (separate from main API health)
app.get('/api/health/ai', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const ServiceFactory = require('./services/service-factory');
        const serviceStatus = await ServiceFactory.getServiceStatus();
        
        res.json({
            success: true,
            aiService: {
                available: true,
                primary: 'openai',
                status: 'online'
            }
        });
    } catch (error) {
        res.json({
            success: true,
            aiService: {
                available: false,
                primary: 'openai', 
                status: 'offline',
                error: error.message
            }
        });
    }
});

// API 404 fallback
app.use('/api', (req, res) => {
    return res.apiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'API endpoint not found'
    });
});

// Static file serving
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(`[${req.requestId || 'no-request-id'}] ❌ Server error:`, error);
    return res.apiError({
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        details: process.env.NODE_ENV === 'production' ? null : error.stack
    });
});

module.exports = app;