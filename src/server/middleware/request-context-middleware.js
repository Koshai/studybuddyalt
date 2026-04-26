// src/server/middleware/request-context-middleware.js
const { randomUUID } = require('crypto');

const requestContextMiddleware = {
    apply(app) {
        app.use((req, res, next) => {
            const incomingRequestId = req.headers['x-request-id'];
            req.requestId = (typeof incomingRequestId === 'string' && incomingRequestId.trim())
                ? incomingRequestId.trim()
                : randomUUID();
            req.requestStartMs = Date.now();

            // Echo request ID to clients for easier debugging.
            res.setHeader('X-Request-Id', req.requestId);
            next();
        });
    }
};

module.exports = requestContextMiddleware;
