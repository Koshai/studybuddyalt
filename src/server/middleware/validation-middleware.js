// src/server/middleware/validation-middleware.js - Request Validation Middleware
const Joi = require('joi');

/**
 * Validate request body against Joi schema
 */
const validateSchema = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Show all validation errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            console.warn('❌ Validation error:', error.details.map(d => d.message).join(', '));
            
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/["]/g, '') // Remove quotes from error messages
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

/**
 * Validate request params against Joi schema
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false
        });

        if (error) {
            console.warn('❌ Params validation error:', error.details.map(d => d.message).join(', '));
            
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/["]/g, '')
            }));

            return res.status(400).json({
                success: false,
                error: 'Parameter validation failed',
                details: errors
            });
        }

        req.params = value;
        next();
    };
};

/**
 * Validate request query parameters against Joi schema
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false
        });

        if (error) {
            console.warn('❌ Query validation error:', error.details.map(d => d.message).join(', '));
            
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/["]/g, '')
            }));

            return res.status(400).json({
                success: false,
                error: 'Query parameter validation failed',
                details: errors
            });
        }

        req.query = value;
        next();
    };
};

module.exports = {
    validateSchema,
    validateParams,
    validateQuery
};