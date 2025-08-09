// src/server/middleware/rate-limit-middleware.js
const rateLimit = require('express-rate-limit');

function apply(app) {
    // General API rate limiting
    const apiLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // 100 requests per minute
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 attempts per 15 minutes
        message: 'Too many authentication attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    // Apply rate limiters
    app.use('/api/', apiLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);

    console.log('⏱️  Rate limiting configured');
}

module.exports = { apply };