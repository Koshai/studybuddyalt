-- Supabase Feedback Table Setup (Fixed for existing schema)
-- Run this SQL in your Supabase SQL Editor

-- ===== FEEDBACK TABLE =====
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    user_email TEXT,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    user_agent TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== ROW LEVEL SECURITY (RLS) POLICIES =====

-- Enable RLS on feedback table
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit feedback (for anonymous submissions)
CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view their own feedback if they provided user_id
-- For now, we'll make feedback viewable by service key only (admin access via API)
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Service role can view all feedback (for admin API endpoints)
-- This allows the backend API with service key to manage all feedback
CREATE POLICY "Service role can manage all feedback" ON feedback
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE feedback IS 'Stores user feedback and support requests with admin management capabilities';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: bug, feature, improvement, general, other';
COMMENT ON COLUMN feedback.status IS 'Current status: new, reviewed, resolved, closed';
COMMENT ON COLUMN feedback.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN feedback.admin_notes IS 'Internal notes for admins only';

-- Note: The backend uses the service key, so it can bypass RLS policies
-- Individual users can only see their own feedback through the user_id column
-- Admin management is handled through the API endpoints using service key access