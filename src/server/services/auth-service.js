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
                username: Joi.string().alphanum().min(3).max(30),
                subscriptionTier: Joi.string().valid('free', 'pro').default('free')
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

        const { email, password, firstName, lastName, username, subscriptionTier } = value;

        try {
            // STEP 1: Check if user already exists by checking the user_profiles table
            const { data: existingProfile } = await this.supabase
                .from('user_profiles')
                .select('id, email')
                .eq('email', email)
                .single();
                
            if (existingProfile) {
                throw new Error('User already exists. Please use login instead.');
            }

            // STEP 2: Create user in Supabase Auth using signUp
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: firstName,
                        last_name: lastName,
                        username: username
                    },
                    emailRedirectTo: undefined, // Disable email confirmation for now
                    captchaToken: undefined
                }
            });

            console.log('Registration auth response:', { 
                hasUser: !!authData?.user, 
                userId: authData?.user?.id,
                needsConfirmation: !authData?.user?.email_confirmed_at,
                authError: authError?.message 
            });

            if (authError) {
                console.error('Auth creation error:', authError);
                
                // Handle duplicate user error
                if (authError.message?.includes('already been registered')) {
                    throw new Error('User already exists. Please use login instead.');
                }
                
                throw new Error(`Registration failed: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('Failed to create user account');
            }

            console.log('✅ Auth user created:', authData.user.id);

            // STEP 2.5: Generate confirmation code for new users
            let confirmationCode = null;
            if (!authData.user.email_confirmed_at) {
                confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                console.log('📧 Generated confirmation code for user:', confirmationCode);
                
                // Store the confirmation code in user metadata
                try {
                    await this.supabase.auth.admin.updateUserById(
                        authData.user.id,
                        { 
                            user_metadata: { 
                                confirmation_code: confirmationCode,
                                confirmation_code_created: new Date().toISOString()
                            }
                        }
                    );
                } catch (error) {
                    console.warn('⚠️ Could not store confirmation code:', error.message);
                }
            }

            // STEP 3: Create user profile with conflict handling
            const profileData = {
                id: authData.user.id,
                email,
                full_name: firstName,
                subscription_tier: subscriptionTier || 'free'
            };

            const { data: profile, error: profileError } = await this.supabase
                .from('user_profiles')
                .upsert(profileData, { 
                    onConflict: 'id',
                    ignoreDuplicates: false 
                })
                .select()
                .single();

            if (profileError) {
                console.error('Profile creation error:', profileError);
                
                // Note: In production, you'd want to set up a cleanup job for orphaned auth users
                // For now, we'll just log the issue and continue
                console.warn('⚠️ Auth user created but profile creation failed. Manual cleanup may be needed.');
                
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }

            console.log('✅ User profile created:', profile.id);

            // STEP 4: Initialize usage tracking
            try {
                await this.initializeUserUsage(authData.user.id);
                console.log('✅ Usage tracking initialized');
            } catch (usageError) {
                console.warn('⚠️ Usage initialization failed:', usageError);
                // Don't fail registration for this
            }

            const result = {
                user: {
                    id: authData.user.id,
                    email: profile.email,
                    username: profile.username,
                    firstName: profile.full_name,
                    lastName: profile.last_name,
                    subscriptionTier: profile.subscription_tier,
                    subscriptionStatus: profile.subscription_status,
                    emailConfirmed: !!authData.user.email_confirmed_at
                },
                tokens: this.generateTokens(authData.user.id)
            };

            // Include confirmation code if email is not confirmed
            if (confirmationCode) {
                result.confirmationCode = confirmationCode;
                result.needsEmailConfirmation = true;
            }

            return result;

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
            console.log(`🔐 Login attempt for: ${email}`);
            
            // Authenticate with Supabase
            const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            console.log('Auth response:', { 
                hasUser: !!authData?.user, 
                userId: authData?.user?.id,
                authError: authError?.message 
            });

            if (authError) {
                console.error('Supabase auth error:', authError);
                
                // Check if it's an email confirmation issue
                if (authError.message?.includes('Email not confirmed') || authError.message?.includes('confirm')) {
                    throw new Error('Please check your email and click the confirmation link before signing in.');
                }
                
                // Check if user exists but wrong password
                if (authError.message?.includes('Invalid login credentials')) {
                    throw new Error('Invalid email or password');
                }
                
                throw new Error(`Authentication failed: ${authError.message}`);
            }

            if (!authData?.user) {
                throw new Error('No user data returned from authentication');
            }

            console.log(`✅ Authentication successful for user: ${authData.user.id}`);

            // Get user profile
            const { data: profileData, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            console.log('Profile query result:', { 
                hasProfile: !!profileData, 
                profileError: profileError?.message 
            });

            if (profileError) {
                console.error('Profile loading error:', profileError);
                
                // If profile doesn't exist, this might be a user created through Supabase UI
                if (profileError.code === 'PGRST116') {
                    throw new Error('User profile not found. Please contact support or try registering again.');
                }
                
                throw new Error(`Failed to load user profile: ${profileError.message}`);
            }

            // Update last login
            await this.supabase
                .from('user_profiles')
                .update({ 
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', authData.user.id);

            console.log(`✅ Login successful for: ${profileData.email}`);

            return {
                user: {
                    id: profileData.id,
                    email: profileData.email,
                    username: profileData.username,
                    firstName: profileData.full_name,
                    lastName: profileData.last_name,
                    subscriptionTier: profileData.subscription_tier,
                    subscriptionStatus: profileData.subscription_status,
                    createdAt: profileData.created_at
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

            // Verify user still exists
            const { data: userData, error } = await this.supabase
                .from('user_profiles')
                .select('id')
                .eq('id', userId)
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
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Supabase getUserProfile error:', error);
                throw new Error('Failed to load user profile');
            }

            return {
                id: data.id,
                email: data.email,
                username: data.username,
                firstName: data.full_name,
                lastName: data.last_name,
                subscriptionTier: data.subscription_tier,
                subscriptionStatus: data.subscription_status,
                currentPeriodEnd: data.current_period_end,
                createdAt: data.created_at
            };
        } catch (error) {
            console.error('getUserProfile network error:', error);
            // Return a mock profile for testing when Supabase is unreachable
            if (error.code === 'ENOTFOUND' || error.cause?.code === 'ENOTFOUND') {
                console.warn('⚠️ Supabase unreachable, using mock profile for testing');
                return {
                    id: userId,
                    email: 'test@example.com',
                    username: 'testuser',
                    firstName: 'Test',
                    lastName: 'User',
                    subscriptionTier: 'pro',
                    subscriptionStatus: 'active',
                    currentPeriodEnd: null,
                    createdAt: new Date().toISOString()
                };
            }
            throw error;
        }
    }

    async updateUserProfile(userId, updates) {
        const allowedUpdates = ['username', 'full_name'];
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

    async confirmEmail(email, confirmationCode = null) {
        try {
            console.log(`📧 Email confirmation for: ${email}`, confirmationCode ? `with code: ${confirmationCode}` : 'manual');
            
            // First get the user by email from user_profiles
            const { data: profileData, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('id, email')
                .eq('email', email)
                .single();

            if (profileError || !profileData) {
                throw new Error('User not found');
            }

            // If confirmation code is provided, verify it
            if (confirmationCode) {
                const { data: authUser, error: authError } = await this.supabase.auth.admin.getUserById(profileData.id);
                
                if (authError || !authUser?.user) {
                    throw new Error('User not found in auth system');
                }
                
                const storedCode = authUser.user.user_metadata?.confirmation_code;
                const codeCreated = authUser.user.user_metadata?.confirmation_code_created;
                
                if (!storedCode) {
                    throw new Error('No confirmation code found. Please try manual confirmation.');
                }
                
                // Check if code is expired (24 hours)
                if (codeCreated) {
                    const codeAge = Date.now() - new Date(codeCreated).getTime();
                    if (codeAge > 24 * 60 * 60 * 1000) {
                        throw new Error('Confirmation code has expired. Please request a new one.');
                    }
                }
                
                if (storedCode.toUpperCase() !== confirmationCode.toUpperCase()) {
                    throw new Error('Invalid confirmation code. Please check and try again.');
                }
                
                console.log('✅ Confirmation code verified');
            }

            // Confirm the user using admin API
            const { error: confirmError } = await this.supabase.auth.admin.updateUserById(
                profileData.id,
                { 
                    email_confirm: true,
                    user_metadata: {
                        confirmation_code: null, // Clear the code after successful confirmation
                        confirmation_code_created: null
                    }
                }
            );

            if (confirmError) {
                console.error('Email confirmation error:', confirmError);
                throw new Error(`Failed to confirm email: ${confirmError.message}`);
            }

            console.log(`✅ Email confirmed for: ${email}`);
            return { success: true, message: 'Email confirmed successfully. You can now sign in.' };

        } catch (error) {
            console.error('Email confirmation error:', error);
            throw error;
        }
    }

    async generateConfirmationCode(email) {
        try {
            console.log(`📧 Generating new confirmation code for: ${email}`);
            
            // First get the user by email from user_profiles
            const { data: profileData, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('id, email')
                .eq('email', email)
                .single();

            if (profileError || !profileData) {
                throw new Error('User not found');
            }

            // Generate a new confirmation code
            const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Store the new confirmation code in user metadata
            const { error: updateError } = await this.supabase.auth.admin.updateUserById(
                profileData.id,
                { 
                    user_metadata: { 
                        confirmation_code: confirmationCode,
                        confirmation_code_created: new Date().toISOString()
                    }
                }
            );

            if (updateError) {
                throw new Error(`Failed to generate confirmation code: ${updateError.message}`);
            }

            console.log(`✅ New confirmation code generated for: ${email}`);
            return { 
                success: true, 
                message: 'New confirmation code generated successfully.',
                confirmationCode: confirmationCode
            };

        } catch (error) {
            console.error('Generate confirmation code error:', error);
            throw error;
        }
    }

    async resendConfirmation(email) {
        try {
            console.log(`📧 Resending confirmation for: ${email}`);
            
            // Use signUp again to trigger a new confirmation email
            const { error } = await this.supabase.auth.signUp({
                email,
                password: 'dummy', // Won't be used since user exists
                options: {
                    emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/confirm`
                }
            });

            // If user already exists, that's fine - it should still send the confirmation
            if (error && !error.message?.includes('already been registered')) {
                throw new Error(`Failed to resend confirmation: ${error.message}`);
            }

            return { success: true, message: 'Confirmation email sent. Please check your inbox.' };

        } catch (error) {
            console.error('Resend confirmation error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;