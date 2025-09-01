// src/server/server.js - Server Startup
const app = require('./app');
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
    console.log('🚀 Jaquizy API Server started');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('─'.repeat(50));
});