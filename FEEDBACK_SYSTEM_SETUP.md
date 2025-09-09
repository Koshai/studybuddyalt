# Feedback System Setup Guide

## Overview
A simple feedback system that allows users to send feedback directly to neloythedev@gmail.com. The system includes:

- 🎨 **Feedback Modal**: Clean, user-friendly form
- 📧 **Email Integration**: Sends formatted emails using nodemailer  
- 🔧 **Simple Configuration**: Works out-of-the-box with test emails

## Features Added

### Frontend Components
- **FeedbackModal**: `/src/frontend/components/Feedback/FeedbackModal.js`
- **Footer Integration**: Updated to show feedback modal
- **API Method**: `window.api.submitFeedback()` added

### Backend Components  
- **Feedback Routes**: `/src/server/routes/feedback-routes.js`
- **Email Service**: Integrated nodemailer for email sending
- **Formatted Emails**: Professional HTML email templates

## How It Works

1. **User clicks "Feedback" button** in the footer
2. **Feedback modal opens** with form fields:
   - Feedback Type (Bug, Feature, Improvement, etc.)
   - Subject line
   - Detailed message  
   - Optional email for follow-up
3. **Form submits** to `/api/feedback`
4. **Backend processes** and sends formatted email to neloythedev@gmail.com
5. **User gets confirmation** notification

## Email Configuration

### Development (Default)
- Uses **Ethereal Email** test service
- No configuration needed
- Emails viewable via preview URLs in console

### Production Setup (Railway)

#### Step 1: Configure Gmail App Password
1. **Go to Gmail Settings**:
   - Visit [myaccount.google.com](https://myaccount.google.com)
   - Click "Security" → "2-Step Verification" (must be enabled)
   - Click "App passwords"

2. **Generate App Password**:
   - Select "Mail" as the app
   - Select "Other" as device, name it "StudyBuddy"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 2: Set Railway Environment Variables
1. **Open Railway Dashboard**:
   - Go to [railway.app](https://railway.app)
   - Select your StudyBuddy project
   - Click on your service

2. **Add Environment Variables**:
   - Go to "Variables" tab
   - Add these variables:

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=neloythedev@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM="StudyBuddy Support <support@studybuddy.com>"
```

#### Step 3: Deploy Changes
1. **Push your code** to trigger Railway deployment
2. **Check logs** in Railway dashboard for email confirmation
3. **Test feedback** on your live site

### Alternative: Using SendGrid (Recommended for Production)
If you prefer a dedicated email service:

1. **Sign up for SendGrid** (free tier: 100 emails/day)
2. **Get API key** from SendGrid dashboard
3. **Set Railway variables**:
```bash
EMAIL_SERVICE=SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM="StudyBuddy Support <support@studybuddy.com>"
```

## Email Content
Feedback emails include:
- **Feedback type** and subject
- **User message** (formatted)
- **User email** (if provided)
- **Timestamp** and user agent
- **User account info** (if logged in)

## Testing

### Local Testing
1. **Start the server**: `npm start`
2. **Open StudyBuddy** in browser  
3. **Click "Feedback"** button in footer
4. **Fill out form** and submit
5. **Check console** for preview URL (development)

### Railway Testing  
1. **Deploy to Railway** (push your code)
2. **Set environment variables** (see Railway setup above)
3. **Open your Railway app** URL
4. **Click "Feedback"** button in footer
5. **Submit test feedback**
6. **Check Railway logs**:
   - Go to Railway dashboard → Your service → "Deployments"
   - Click on latest deployment → "View Logs"
   - Look for email confirmation messages
7. **Check neloythedev@gmail.com** for the feedback email

### Troubleshooting Railway Issues
- **No emails received**: Check Railway logs for errors
- **Gmail authentication error**: Verify app password is correct
- **Environment variables**: Make sure all EMAIL_* variables are set
- **Deployment**: Ensure latest code is deployed (check commit hash)

## Files Modified/Created

### New Files
- `src/frontend/components/Feedback/FeedbackModal.js`
- `src/server/routes/feedback-routes.js`  
- `.env.example` (email config template)

### Modified Files
- `src/frontend/components/Layout/Footer.js` (added modal)
- `src/frontend/js/api-simplified.js` (added API method)
- `src/server/app.js` (registered feedback routes)
- `src/frontend/index.html` (loaded FeedbackModal component)
- `package.json` (added nodemailer dependency)

## Ready to Use! 🎉

The feedback system is now fully functional. Users can:
- ✅ Submit feedback through a clean modal interface
- ✅ Choose feedback type (bug, feature, improvement, etc.)
- ✅ Provide detailed messages
- ✅ Optionally include email for follow-up
- ✅ Get confirmation when feedback is sent

All feedback will be sent to **neloythedev@gmail.com** with formatted, professional emails containing all the necessary details for follow-up.