// src/server/services/usage-service.js
const { createClient } = require('@supabase/supabase-js');

class UsageService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        this.limits = {
            free: {
                questionsPerMonth: 100,
                topicsPerSubject: 5,
                storageBytes: 100 * 1024 * 1024 // 100MB
            },
            pro: {
                questionsPerMonth: 1500,
                topicsPerSubject: -1, // unlimited
                storageBytes: 5 * 1024 * 1024 * 1024 // 5GB
            }
        };
    }

    async getCurrentUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const { data, error } = await this.supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('month_year', currentMonth)
            .single();

        if (error) {
            // Create usage record if it doesn't exist
            if (error.code === 'PGRST116') {
                return await this.initializeMonthlyUsage(userId);
            }
            throw new Error('Failed to get usage data');
        }

        return data;
    }

    async checkQuestionLimit(userId, userTier) {
        const usage = await this.getCurrentUsage(userId);
        const limit = this.limits[userTier].questionsPerMonth;
        
        if (usage.questions_used >= limit) {
            throw new Error(`Monthly question limit reached (${limit}). Upgrade to Pro for more questions!`);
        }

        return {
            used: usage.questions_used,
            limit: limit,
            remaining: limit - usage.questions_used
        };
    }

    async incrementQuestionUsage(userId, count = 1) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const { error } = await this.supabase
            .from('user_usage')
            .update({ 
                questions_used: this.supabase.raw('questions_used + ?', [count])
            })
            .eq('user_id', userId)
            .eq('month_year', currentMonth);

        if (error) {
            throw new Error('Failed to update question usage');
        }
    }

    async checkTopicLimit(userId, userTier, subjectId) {
        const limit = this.limits[userTier].topicsPerSubject;
        
        if (limit === -1) return true; // Unlimited for pro
        
        const { data, error } = await this.supabase
            .from('topics')
            .select('id')
            .eq('user_id', userId)
            .eq('subject_id', subjectId);

        if (error) {
            throw new Error('Failed to check topic limit');
        }

        if (data.length >= limit) {
            throw new Error(`Topic limit reached for this subject (${limit}). Upgrade to Pro for unlimited topics!`);
        }

        return true;
    }

    async checkStorageLimit(userId, userTier, additionalBytes = 0) {
        const usage = await this.getCurrentUsage(userId);
        const limit = this.limits[userTier].storageBytes;
        
        if ((usage.storage_used + additionalBytes) > limit) {
            const limitMB = Math.round(limit / (1024 * 1024));
            throw new Error(`Storage limit exceeded (${limitMB}MB). Upgrade to Pro for more storage!`);
        }

        return true;
    }

    async incrementStorageUsage(userId, bytes) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const { error } = await this.supabase
            .from('user_usage')
            .update({ 
                storage_used: this.supabase.raw('storage_used + ?', [bytes])
            })
            .eq('user_id', userId)
            .eq('month_year', currentMonth);

        if (error) {
            throw new Error('Failed to update storage usage');
        }
    }

    async initializeMonthlyUsage(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const { data, error } = await this.supabase
            .from('user_usage')
            .insert({
                user_id: userId,
                month_year: currentMonth,
                questions_used: 0,
                storage_used: 0
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to initialize monthly usage');
        }

        return data;
    }

    async getUsageStats(userId) {
        const usage = await this.getCurrentUsage(userId);
        const user = await this.supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        const tier = user.data.subscription_tier;
        const limits = this.limits[tier];

        return {
            questions: {
                used: usage.questions_used,
                limit: limits.questionsPerMonth,
                percentage: Math.round((usage.questions_used / limits.questionsPerMonth) * 100)
            },
            storage: {
                used: usage.storage_used,
                limit: limits.storageBytes,
                percentage: Math.round((usage.storage_used / limits.storageBytes) * 100),
                usedMB: Math.round(usage.storage_used / (1024 * 1024)),
                limitMB: Math.round(limits.storageBytes / (1024 * 1024))
            },
            tier: tier
        };
    }
}

module.exports = UsageService;