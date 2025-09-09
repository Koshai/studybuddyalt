// src/server/routes/feedback-routes.js - Feedback Routes
const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Get database instance
const database = require('../services/database-simplified');

/**
 * POST /api/feedback - Submit feedback
 */
router.post('/', async (req, res) => {
    try {
        const { type, subject, message, email } = req.body;
        
        // Validate required fields
        if (!type || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Type, subject, and message are required'
            });
        }
        
        console.log('📬 New feedback received:', {
            type,
            subject,
            hasEmail: !!email,
            messageLength: message.length
        });
        
        // Get user info if available (not required for feedback)
        const userInfo = req.user ? {
            userId: req.user.id || req.user.user_id,
            userEmail: req.user.email
        } : null;
        
        // Create email content
        const emailContent = createFeedbackEmail({
            type,
            subject,
            message,
            userEmail: email,
            userInfo,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent']
        });
        
        // Save feedback to database
        try {
            const savedFeedback = await database.feedbackService.submitFeedback({
                type,
                subject,
                message,
                userEmail: email,
                userId: userInfo?.userId || null,
                userAgent: req.headers['user-agent']
            });

            console.log('✅ Feedback saved to database:', savedFeedback.id);

            // Respond immediately to prevent timeout
            res.json({
                success: true,
                message: 'Feedback submitted successfully',
                feedbackId: savedFeedback.id
            });

            // Optionally log for admin visibility
            console.log('📧 NEW FEEDBACK SUBMITTED:');
            console.log('================================================');
            console.log(`ID: ${savedFeedback.id}`);
            console.log(`Type: ${type}`);
            console.log(`Subject: ${subject}`);
            console.log(`From: ${email || 'Anonymous'}`);
            console.log(`Time: ${new Date().toLocaleString()}`);
            console.log('------------------------------------------------');
            console.log(`Message: ${message}`);
            console.log('================================================');
        } catch (dbError) {
            console.error('❌ Failed to save feedback to database:', dbError);
            
            // Still respond with success since feedback was logged
            res.json({
                success: true,
                message: 'Feedback submitted successfully'
            });

            // Fallback logging
            console.log('📧 FEEDBACK (DB SAVE FAILED - CONSOLE BACKUP):');
            console.log('================================================');
            console.log(`Type: ${type}`);
            console.log(`Subject: ${subject}`);
            console.log(`From: ${email || 'Anonymous'}`);
            console.log(`Time: ${new Date().toLocaleString()}`);
            console.log('------------------------------------------------');
            console.log(`Message: ${message}`);
            console.log('================================================');
        }
        
    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});

/**
 * GET /api/feedback - Get all feedback (admin only)
 */
router.get('/', async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            status,
            type,
            priority,
            orderBy = 'created_at',
            orderDirection = 'DESC'
        } = req.query;

        const feedback = await database.feedbackService.getAllFeedback({
            limit: parseInt(limit),
            offset: parseInt(offset),
            status,
            type,
            priority,
            orderBy,
            orderDirection
        });

        res.json({
            success: true,
            data: feedback,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback'
        });
    }
});

/**
 * GET /api/feedback/stats - Get feedback statistics (admin only)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await database.feedbackService.getFeedbackStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Error fetching feedback stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback statistics'
        });
    }
});

/**
 * GET /api/feedback/:id - Get specific feedback (admin only)
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await database.feedbackService.getFeedbackById(id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                error: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('❌ Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback'
        });
    }
});

/**
 * PUT /api/feedback/:id - Update feedback status/priority/notes (admin only)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, admin_notes } = req.body;
        
        const updates = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (admin_notes !== undefined) updates.admin_notes = admin_notes;

        const result = await database.feedbackService.updateFeedback(id, updates);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Error updating feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update feedback'
        });
    }
});

/**
 * DELETE /api/feedback/:id - Delete feedback (admin only)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database.feedbackService.deleteFeedback(id);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete feedback'
        });
    }
});

/**
 * Create formatted email content for feedback
 */
function createFeedbackEmail(feedback) {
    const typeEmojis = {
        bug: '🐛',
        feature: '✨',
        improvement: '🚀',
        general: '💬',
        other: '📝'
    };
    
    const emoji = typeEmojis[feedback.type] || '📝';
    
    return {
        subject: `${emoji} StudyBuddy Feedback: ${feedback.subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3b82f6; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                    ${emoji} New Feedback - StudyBuddy
                </h2>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${feedback.subject}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">User Email:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${feedback.userEmail || 'Anonymous'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Timestamp:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${new Date(feedback.timestamp).toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
                    <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px;">
                        ${feedback.message.replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                ${feedback.userInfo ? `
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #1e40af; margin-bottom: 10px;">User Information:</h4>
                    <p style="color: #3730a3; margin: 5px 0;">User ID: ${feedback.userInfo.userId || 'N/A'}</p>
                    <p style="color: #3730a3; margin: 5px 0;">Account Email: ${feedback.userInfo.userEmail || 'N/A'}</p>
                </div>
                ` : ''}
                
                <div style="background-color: #f9fafb; padding: 10px; border-radius: 4px; margin: 20px 0; font-size: 12px; color: #6b7280;">
                    <p><strong>User Agent:</strong> ${feedback.userAgent}</p>
                    <p><strong>Source:</strong> StudyBuddy Feedback System</p>
                </div>
            </div>
        `
    };
}

/**
 * Send feedback email using nodemailer
 */
async function sendFeedbackEmail(emailContent) {
    // Add timeout wrapper to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000);
    });

    const emailPromise = sendEmailInternal(emailContent);
    
    try {
        return await Promise.race([emailPromise, timeoutPromise]);
    } catch (error) {
        console.error('❌ Email sending failed or timed out:', error.message);
        throw error;
    }
}

async function sendEmailInternal(emailContent) {
    // For now, we'll use a simple SMTP configuration
    // You can configure this with your preferred email service
    
    // Create a test account using Ethereal Email for development
    // In production, you should use a real email service like Gmail, SendGrid, etc.
    
    try {
        // Try to use environment variables for email configuration
        let transporter;
        
        if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Production email configuration
            console.log('🔧 Using production email config:', {
                service: process.env.EMAIL_SERVICE,
                user: process.env.EMAIL_USER?.substring(0, 5) + '***',
                hasPass: !!process.env.EMAIL_PASS
            });
            
            transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                // Add timeout settings for Gmail
                connectionTimeout: 8000, // 8 seconds
                greetingTimeout: 5000,   // 5 seconds
                socketTimeout: 8000      // 8 seconds
            });
        } else {
            // Development: Create test account
            const testAccount = await nodemailer.createTestAccount();
            
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            
            console.log('📧 Using test email account for development');
        }
        
        // Send email
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'StudyBuddy <noreply@studybuddy.com>',
            to: 'neloythedev@gmail.com',
            subject: emailContent.subject,
            html: emailContent.html
        });
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('📧 Test email sent: %s', info.messageId);
            console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        
        return info;
        
    } catch (error) {
        console.error('❌ Failed to send feedback email:', error);
        throw error;
    }
}

module.exports = router;