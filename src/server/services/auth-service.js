// src/server/services/auth-service.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

class AuthService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
    }

    // Validation schemas
    getValidationSchemas() {
        return {
            register: Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().min(8).required(),
                firstName: Joi.string().min(2).max(50),
                lastName: Joi.string().min(2).max(50),
                username: Joi.string().alphanum().min(3).max(30)
            }),
            
            login: Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().required()
            })
        };
    }

    async register(userData) {
        const { error: validationError, value } = this.getValidationSchemas().register.validate(userData);
        if (validationError) {
            throw new Error(`Validation error: ${validationError.details[0].message}`);
        }

        const { email, password, firstName, lastName, username } = value;

        try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (authError) {
                throw new Error(`Registration failed: ${authError.message}`);
            }

            // Create user profile
            const { data: profileData, error: profileError } = await this.supabase
                .from('user_profiles')
                .insert({
                    id: authData.user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    subscription_tier: 'free'
                })
                .select()
                .single();

            if (profileError) {
                // Clean up auth user if profile creation fails
                await this.supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }

            // Initialize usage tracking
            await this.initializeUserUsage(authData.user.id);

            return {
                user: {
                    id: authData.user.id,
                    email: profileData.email,
                    username: profileData.username,
                    firstName: profileData.first_name,
                    lastName: profileData.last_name,
                    subscriptionTier: profileData.subscription_tier
                },
                tokens: this.generateTokens(authData.user.id)
            };

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password) {
        const { error: validationError } = this.getValidationSchemas().login.validate({ email, password });
        if (validationError) {
            throw new Error(`Validation error: ${validationError.details[0].message}`);
        }

        try {
            // Authenticate with Supabase
            const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                throw new Error('Invalid email or password');
            }

            // Get user profile
            const { data: profileData, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                throw new Error('Failed to load user profile');
            }

            // Update last login
            await this.supabase
                .from('user_profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', authData.user.id);

            return {
                user: {
                    id: profileData.id,
                    email: profileData.email,
                    username: profileData.username,
                    firstName: profileData.first_name,
                    lastName: profileData.last_name,
                    subscriptionTier: profileData.subscription_tier,
                    subscriptionStatus: profileData.subscription_status
                },
                tokens: this.generateTokens(authData.user.id)
            };

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const userId = decoded.userId;

            // Verify user still exists and is active
            const { data: userData, error } = await this.supabase
                .from('user_profiles')
                .select('id, is_active')
                .eq('id', userId)
                .eq('is_active', true)
                .single();

            if (error || !userData) {
                throw new Error('Invalid refresh token');
            }

            return this.generateTokens(userId);

        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async logout(refreshToken) {
        // In a production app, you'd add the refresh token to a blacklist
        // For now, we'll just return success
        return { success: true, message: 'Logged out successfully' };
    }

    async getUserProfile(userId) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error('Failed to load user profile');
        }

        return {
            id: data.id,
            email: data.email,
            username: data.username,
            firstName: data.first_name,
            lastName: data.last_name,
            subscriptionTier: data.subscription_tier,
            subscriptionStatus: data.subscription_status,
            currentPeriodEnd: data.current_period_end,
            createdAt: data.created_at
        };
    }

    async updateUserProfile(userId, updates) {
        const allowedUpdates = ['username', 'first_name', 'last_name'];
        const filteredUpdates = {};
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        const { data, error } = await this.supabase
            .from('user_profiles')
            .update(filteredUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update profile');
        }

        return data;
    }

    generateTokens(userId) {
        const accessToken = jwt.sign(
            { userId, type: 'access' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE_TIME || '24h' }
        );

        const refreshToken = jwt.sign(
            { userId, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '7d' }
        );

        return { accessToken, refreshToken };
    }

    async initializeUserUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7); // '2024-01'
        
        const { error } = await this.supabase
            .from('user_usage')
            .insert({
                user_id: userId,
                month_year: currentMonth,
                questions_used: 0,
                storage_used: 0
            });

        if (error && !error.message.includes('duplicate')) {
            console.error('Failed to initialize user usage:', error);
        }
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = AuthService;