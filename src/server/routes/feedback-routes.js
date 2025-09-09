// src/server/routes/feedback-routes.js - Feedback Routes
const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

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
        
        // Send email (temporarily disabled to prevent 500 errors)
        // await sendFeedbackEmail(emailContent);
        
        // For now, just log the feedback
        console.log('✅ Feedback received and logged:', {
            type: type,
            subject: subject,
            message: message,
            userEmail: email,
            userInfo: userInfo,
            timestamp: new Date().toISOString()
        });
        console.log('✅ Feedback processed successfully (email disabled)');
        
        res.json({
            success: true,
            message: 'Feedback submitted successfully'
        });
        
    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
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
    // For now, we'll use a simple SMTP configuration
    // You can configure this with your preferred email service
    
    // Create a test account using Ethereal Email for development
    // In production, you should use a real email service like Gmail, SendGrid, etc.
    
    try {
        // Try to use environment variables for email configuration
        let transporter;
        
        if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Production email configuration
            transporter = nodemailer.createTransporter({
                service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else {
            // Development: Create test account
            const testAccount = await nodemailer.createTestAccount();
            
            transporter = nodemailer.createTransporter({
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