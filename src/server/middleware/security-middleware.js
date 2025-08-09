// src/server/middleware/security-middleware.js
const helmet = require('helmet');

function apply(app) {
    // Enhanced Content Security Policy for Railway deployment
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                    "'self'", 
                    "'unsafe-inline'", 
                    "https://cdnjs.cloudflare.com",
                    "https://unpkg.com",
                    "https://cdn.jsdelivr.net",
                    "https://fonts.googleapis.com",
                    "https://cdn.tailwindcss.com"
                ],
                scriptSrc: [
                    "'self'", 
                    "'unsafe-inline'", 
                    "'unsafe-eval'",
                    "https://cdnjs.cloudflare.com",
                    "https://unpkg.com",
                    "https://cdn.jsdelivr.net",
                    "https://cdn.tailwindcss.com",
                    "https://pagead2.googlesyndication.com"
                ],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                fontSrc: [
                    "'self'",
                    "https://cdnjs.cloudflare.com",
                    "https://unpkg.com", 
                    "https://cdn.jsdelivr.net",
                    "https://fonts.gstatic.com"
                ],
                connectSrc: [
                    "'self'",
                    "https://api.openai.com",
                    "https://*.supabase.co",
                    process.env.RAILWAY_ENVIRONMENT_NAME ? "https://*.railway.app" : "http://localhost:*"
                ],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'self'"]
            },
        },
        crossOriginEmbedderPolicy: false
    }));

    console.log('🔒 Security middleware configured');
}

module.exports = { apply };