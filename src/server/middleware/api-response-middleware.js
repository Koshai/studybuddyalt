// src/server/middleware/api-response-middleware.js
const apiResponseMiddleware = {
    apply(app) {
        app.use((req, res, next) => {
            res.apiError = ({
                status = 500,
                code = 'INTERNAL_ERROR',
                message = 'An unexpected error occurred',
                details = null
            } = {}) => {
                const body = {
                    success: false,
                    error: {
                        code,
                        message
                    },
                    requestId: req.requestId
                };

                if (details && process.env.NODE_ENV !== 'production') {
                    body.error.details = details;
                }

                return res.status(status).json(body);
            };

            res.apiSuccess = (data = {}, status = 200) => {
                return res.status(status).json({
                    success: true,
                    data,
                    requestId: req.requestId
                });
            };

            next();
        });
    }
};

module.exports = apiResponseMiddleware;
