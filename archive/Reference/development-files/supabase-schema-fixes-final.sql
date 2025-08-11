-- Final Safe Supabase Schema Fixes for Jaquizy
-- Fixed syntax errors and improved error handling

-- =============================================================================
-- FIX 1: Add missing note_id column to questions table (SAFE VERSION)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'note_id'
    ) THEN
        ALTER TABLE questions ADD COLUMN note_id UUID REFERENCES notes(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added note_id column to questions table';
    ELSE
        RAISE NOTICE '⚠️ note_id column already exists in questions table - skipping';
    END IF;
END $$;

-- Add index for performance (safe - will only create if doesn't exist)
CREATE INDEX IF NOT EXISTS idx_questions_note_id ON questions(note_id);

-- =============================================================================
-- FIX 2: Create missing usage_tracking table (CRITICAL for billing)
-- =============================================================================

DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
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
        RAISE NOTICE '✅ Created usage_tracking table';
    ELSE
        RAISE NOTICE '⚠️ usage_tracking table already exists - skipping';
    END IF;
END $$;

-- Add indexes for performance (safe)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month_year ON usage_tracking(month_year);

-- Enable Row Level Security (safe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'usage_tracking') THEN
        ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS enabled on usage_tracking table';
    END IF;
END $$;

-- RLS Policies for usage_tracking (safe)
DO $$
BEGIN
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'usage_tracking' AND policyname = 'Users can view own usage'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own usage" ON usage_tracking
            FOR SELECT USING (auth.uid() = user_id)';
        RAISE NOTICE '✅ Created SELECT policy for usage_tracking';
    END IF;

    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'usage_tracking' AND policyname = 'Users can create own usage'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can create own usage" ON usage_tracking
            FOR INSERT WITH CHECK (auth.uid() = user_id)';
        RAISE NOTICE '✅ Created INSERT policy for usage_tracking';
    END IF;

    -- Check and create UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'usage_tracking' AND policyname = 'Users can update own usage'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own usage" ON usage_tracking
            FOR UPDATE USING (auth.uid() = user_id)';
        RAISE NOTICE '✅ Created UPDATE policy for usage_tracking';
    END IF;
END $$;

-- =============================================================================
-- FIX 3: Add missing updated_at columns for sync tracking (SAFE VERSION)
-- =============================================================================

-- Add updated_at to notes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE notes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to notes table';
    ELSE
        RAISE NOTICE '⚠️ updated_at column already exists in notes table - skipping';
    END IF;
END $$;

-- Add updated_at to questions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to questions table';
    ELSE
        RAISE NOTICE '⚠️ updated_at column already exists in questions table - skipping';
    END IF;
END $$;

-- Add updated_at to practice_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_sessions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE practice_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to practice_sessions table';
    ELSE
        RAISE NOTICE '⚠️ updated_at column already exists in practice_sessions table - skipping';
    END IF;
END $$;

-- Add updated_at to user_answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_answers' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_answers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to user_answers table';
    ELSE
        RAISE NOTICE '⚠️ updated_at column already exists in user_answers table - skipping';
    END IF;
END $$;

-- =============================================================================
-- FIX 4: Add update triggers (SAFE VERSION)
-- =============================================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Add triggers (safe - will replace if exists)
    DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
    CREATE TRIGGER update_usage_tracking_updated_at 
        BEFORE UPDATE ON usage_tracking
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
    CREATE TRIGGER update_notes_updated_at 
        BEFORE UPDATE ON notes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
    CREATE TRIGGER update_questions_updated_at 
        BEFORE UPDATE ON questions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_practice_sessions_updated_at ON practice_sessions;
    CREATE TRIGGER update_practice_sessions_updated_at 
        BEFORE UPDATE ON practice_sessions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_user_answers_updated_at ON user_answers;
    CREATE TRIGGER update_user_answers_updated_at 
        BEFORE UPDATE ON user_answers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '✅ Created/updated all update triggers';
END $$;

-- =============================================================================
-- FIX 5: Add sync tracking columns for conflict resolution (SAFE VERSION)
-- =============================================================================

-- Add last_synced to topics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' AND column_name = 'last_synced'
    ) THEN
        ALTER TABLE topics ADD COLUMN last_synced TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_synced column to topics table';
    ELSE
        RAISE NOTICE '⚠️ last_synced column already exists in topics table - skipping';
    END IF;
END $$;

-- Add last_synced to notes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'last_synced'
    ) THEN
        ALTER TABLE notes ADD COLUMN last_synced TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_synced column to notes table';
    ELSE
        RAISE NOTICE '⚠️ last_synced column already exists in notes table - skipping';
    END IF;
END $$;

-- Add last_synced to questions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'last_synced'
    ) THEN
        ALTER TABLE questions ADD COLUMN last_synced TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_synced column to questions table';
    ELSE
        RAISE NOTICE '⚠️ last_synced column already exists in questions table - skipping';
    END IF;
END $$;

-- Add last_synced to practice_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_sessions' AND column_name = 'last_synced'
    ) THEN
        ALTER TABLE practice_sessions ADD COLUMN last_synced TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_synced column to practice_sessions table';
    ELSE
        RAISE NOTICE '⚠️ last_synced column already exists in practice_sessions table - skipping';
    END IF;
END $$;

-- Add last_synced to user_answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_answers' AND column_name = 'last_synced'
    ) THEN
        ALTER TABLE user_answers ADD COLUMN last_synced TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_synced column to user_answers table';
    ELSE
        RAISE NOTICE '⚠️ last_synced column already exists in user_answers table - skipping';
    END IF;
END $$;

-- Add last_synced to usage_tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usage_tracking' AND column_name = 'last_synced'
    ) THEN
        ALTER TABLE usage_tracking ADD COLUMN last_synced TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_synced column to usage_tracking table';
    ELSE
        RAISE NOTICE '⚠️ last_synced column already exists in usage_tracking table - skipping';
    END IF;
END $$;

-- =============================================================================
-- FIX 6: Create helpful views for sync operations (SAFE VERSION)
-- =============================================================================

DO $$
BEGIN
    -- Drop and recreate view (safe)
    DROP VIEW IF EXISTS user_sync_status;
    CREATE VIEW user_sync_status AS
    SELECT 
        up.id as user_id,
        up.email,
        COUNT(DISTINCT t.id) as total_topics,
        COUNT(DISTINCT n.id) as total_notes,
        COUNT(DISTINCT q.id) as total_questions,
        COUNT(DISTINCT ps.id) as total_practice_sessions,
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

    RAISE NOTICE '✅ Created user_sync_status view';
END $$;

-- =============================================================================
-- FIX 7: Add sync helper functions (SAFE VERSION)
-- =============================================================================

-- Function to update sync timestamps (safe)
CREATE OR REPLACE FUNCTION update_sync_timestamp(table_name text, record_id uuid)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET last_synced = NOW() WHERE id = $1', table_name) 
    USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get records modified since last sync (safe)
CREATE OR REPLACE FUNCTION get_modified_since(table_name text, since_timestamp timestamptz)
RETURNS TABLE(id uuid, updated_at timestamptz) AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT id, updated_at FROM %I WHERE updated_at > $1 ORDER BY updated_at',
        table_name
    ) USING since_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Created sync helper functions';
END $$;

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

DO $$
DECLARE
    missing_items text[] := ARRAY[]::text[];
BEGIN
    -- Check essential components
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
        missing_items := array_append(missing_items, 'usage_tracking table');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'note_id') THEN
        missing_items := array_append(missing_items, 'questions.note_id column');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'updated_at') THEN
        missing_items := array_append(missing_items, 'notes.updated_at column');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'last_synced') THEN
        missing_items := array_append(missing_items, 'topics.last_synced column');
    END IF;

    IF array_length(missing_items, 1) > 0 THEN
        RAISE EXCEPTION '❌ SCHEMA FIXES INCOMPLETE: Missing %', array_to_string(missing_items, ', ');
    ELSE
        RAISE NOTICE '🎉 ALL SCHEMA FIXES APPLIED SUCCESSFULLY!';
        RAISE NOTICE '🔄 Your Jaquizy sync system is now ready to use!';
        RAISE NOTICE '📊 You can now deploy with full SQLite ↔️ Supabase sync';
    END IF;
END $$;