-- Supabase Feedback Table Setup
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

-- Policy: Admin users can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
        OR 
        -- Allow users to see their own feedback if they provided user_id
        user_id = auth.uid()
    );

-- Policy: Admin users can update all feedback
CREATE POLICY "Admins can update all feedback" ON feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Admin users can delete all feedback
CREATE POLICY "Admins can delete all feedback" ON feedback
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add comment for documentation
COMMENT ON TABLE feedback IS 'Stores user feedback and support requests with admin management capabilities';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: bug, feature, improvement, general, other';
COMMENT ON COLUMN feedback.status IS 'Current status: new, reviewed, resolved, closed';
COMMENT ON COLUMN feedback.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN feedback.admin_notes IS 'Internal notes for admins only';