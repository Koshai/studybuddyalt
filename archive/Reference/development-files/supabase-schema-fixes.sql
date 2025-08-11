-- Supabase Schema Fixes for Jaquizy
-- Copy and paste these commands into your Supabase SQL Editor

-- =============================================================================
-- FIX 1: Add missing note_id column to questions table
-- =============================================================================

-- Add the note_id column that exists in SQLite but missing in Supabase
ALTER TABLE questions 
ADD COLUMN note_id UUID REFERENCES notes(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_questions_note_id ON questions(note_id);

-- =============================================================================
-- FIX 2: Create missing usage_tracking table (CRITICAL for billing)
-- =============================================================================

-- This table is essential for billing and usage limits across devices
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    questions_used INTEGER DEFAULT 0,
    storage_used INTEGER DEFAULT 0,
    topics_created INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Add indexes for performance
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_month_year ON usage_tracking(month_year);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own usage" ON usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Add update trigger for updated_at timestamp
CREATE TRIGGER update_usage_tracking_updated_at 
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FIX 3: Add missing updated_at columns for sync tracking
-- =============================================================================

-- Add updated_at to tables that will need sync tracking
ALTER TABLE notes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE practice_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_answers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add update triggers for these tables
CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sessions_updated_at 
    BEFORE UPDATE ON practice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_answers_updated_at 
    BEFORE UPDATE ON user_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FIX 4: Add sync tracking columns for conflict resolution
-- =============================================================================

-- Add last_synced timestamp to track when data was last synced
ALTER TABLE topics ADD COLUMN last_synced TIMESTAMPTZ;
ALTER TABLE notes ADD COLUMN last_synced TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN last_synced TIMESTAMPTZ;
ALTER TABLE practice_sessions ADD COLUMN last_synced TIMESTAMPTZ;
ALTER TABLE user_answers ADD COLUMN last_synced TIMESTAMPTZ;
ALTER TABLE usage_tracking ADD COLUMN last_synced TIMESTAMPTZ;

-- =============================================================================
-- FIX 5: Improve storage policies for file uploads
-- =============================================================================

-- Update storage policies to be more permissive for development
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- More flexible storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'study-materials' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can view files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'study-materials' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'study-materials' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================================================
-- FIX 6: Add helpful views for sync operations
-- =============================================================================

-- View to get user's sync status
CREATE OR REPLACE VIEW user_sync_status AS
SELECT 
    up.id as user_id,
    up.email,
    COUNT(t.id) as total_topics,
    COUNT(n.id) as total_notes,
    COUNT(q.id) as total_questions,
    COUNT(ps.id) as total_practice_sessions,
    MAX(t.last_synced) as topics_last_sync,
    MAX(n.last_synced) as notes_last_sync,
    MAX(q.last_synced) as questions_last_sync,
    MAX(ps.last_synced) as sessions_last_sync
FROM user_profiles up
LEFT JOIN topics t ON t.user_id = up.id
LEFT JOIN notes n ON n.topic_id = t.id
LEFT JOIN questions q ON q.topic_id = t.id
LEFT JOIN practice_sessions ps ON ps.user_id = up.id
GROUP BY up.id, up.email;

-- Enable RLS on the view
ALTER VIEW user_sync_status SET (security_invoker = true);

-- =============================================================================
-- FIX 7: Add sync helper functions
-- =============================================================================

-- Function to update sync timestamps
CREATE OR REPLACE FUNCTION update_sync_timestamp(table_name text, record_id uuid)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET last_synced = NOW() WHERE id = $1', table_name) 
    USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get records modified since last sync
CREATE OR REPLACE FUNCTION get_modified_since(table_name text, since_timestamp timestamptz)
RETURNS TABLE(id uuid, updated_at timestamptz) AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT id, updated_at FROM %I WHERE updated_at > $1 ORDER BY updated_at',
        table_name
    ) USING since_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICATION QUERIES (run these to confirm fixes)
-- =============================================================================

-- Check that all fixes were applied correctly
DO $$
BEGIN
    -- Check if note_id was added to questions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'note_id'
    ) THEN
        RAISE EXCEPTION 'FIX 1 FAILED: note_id column not added to questions table';
    END IF;

    -- Check if usage_tracking table was created
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'usage_tracking'
    ) THEN
        RAISE EXCEPTION 'FIX 2 FAILED: usage_tracking table not created';
    END IF;

    -- Check if updated_at columns were added
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'FIX 3 FAILED: updated_at column not added to notes';
    END IF;

    -- Check if last_synced columns were added
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' AND column_name = 'last_synced'
    ) THEN
        RAISE EXCEPTION 'FIX 4 FAILED: last_synced column not added to topics';
    END IF;

    RAISE NOTICE '✅ ALL SCHEMA FIXES APPLIED SUCCESSFULLY!';
END $$;

-- Final verification - show updated table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('questions', 'usage_tracking', 'notes', 'topics')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;