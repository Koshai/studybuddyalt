-- Jaquizy Flashcard Tables Update
-- Run this SQL to add missing columns and tables for existing flashcard schema

-- ===== ADD MISSING COLUMNS TO EXISTING TABLES =====

-- Add any missing columns to flashcard_sets if needed
DO $$
BEGIN
    -- Check if user_id is UUID type and needs to be TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='flashcard_sets' AND column_name='user_id' AND data_type='uuid'
    ) THEN
        -- Convert user_id from UUID to TEXT if needed
        ALTER TABLE flashcard_sets ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Converted flashcard_sets.user_id from UUID to TEXT';
    END IF;
    
    -- Ensure all expected columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcard_sets' AND column_name='updated_at') THEN
        ALTER TABLE flashcard_sets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add any missing columns to flashcards if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='updated_at') THEN
        ALTER TABLE flashcards ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ===== CREATE MISSING FLASHCARD_ANSWERS TABLE (if needed for detailed tracking) =====
CREATE TABLE IF NOT EXISTS flashcard_answers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL REFERENCES flashcard_sessions(id) ON DELETE CASCADE,
    flashcard_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE, -- Using existing column name
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER, -- milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ADD INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_subject_id ON flashcard_sets(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_topic_id ON flashcard_sets(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_user_id ON flashcard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_set_id ON flashcard_sessions(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id ON flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_flashcard_id ON flashcard_progress(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_answers_session_id ON flashcard_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_answers_flashcard_id ON flashcard_answers(flashcard_id);

-- ===== ENABLE ROW LEVEL SECURITY (if not already enabled) =====
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_answers ENABLE ROW LEVEL SECURITY;

-- ===== CREATE ROW LEVEL SECURITY POLICIES (drop existing first to avoid conflicts) =====

-- Flashcard Sets Policies
DROP POLICY IF EXISTS "Users can view own flashcard sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can insert own flashcard sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can update own flashcard sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can delete own flashcard sets" ON flashcard_sets;

CREATE POLICY "Users can view own flashcard sets" ON flashcard_sets FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own flashcard sets" ON flashcard_sets FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own flashcard sets" ON flashcard_sets FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own flashcard sets" ON flashcard_sets FOR DELETE USING (user_id = auth.uid()::text);

-- Flashcards Policies
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert flashcards to own sets" ON flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards;

CREATE POLICY "Users can view own flashcards" ON flashcards FOR SELECT USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert flashcards to own sets" ON flashcards FOR INSERT WITH CHECK (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can update own flashcards" ON flashcards FOR UPDATE USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can delete own flashcards" ON flashcards FOR DELETE USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid()::text)
);

-- Flashcard Sessions Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON flashcard_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON flashcard_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON flashcard_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON flashcard_sessions;

CREATE POLICY "Users can view own sessions" ON flashcard_sessions FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own sessions" ON flashcard_sessions FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own sessions" ON flashcard_sessions FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own sessions" ON flashcard_sessions FOR DELETE USING (user_id = auth.uid()::text);

-- Flashcard Progress Policies  
DROP POLICY IF EXISTS "Users can view own progress" ON flashcard_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON flashcard_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON flashcard_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON flashcard_progress;

CREATE POLICY "Users can view own progress" ON flashcard_progress FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own progress" ON flashcard_progress FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own progress" ON flashcard_progress FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own progress" ON flashcard_progress FOR DELETE USING (user_id = auth.uid()::text);

-- Flashcard Answers Policies (for the new table)
DROP POLICY IF EXISTS "Users can view own flashcard answers" ON flashcard_answers;
DROP POLICY IF EXISTS "Users can insert own flashcard answers" ON flashcard_answers;

CREATE POLICY "Users can view own flashcard answers" ON flashcard_answers FOR SELECT USING (
    session_id IN (SELECT id FROM flashcard_sessions WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert own flashcard answers" ON flashcard_answers FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM flashcard_sessions WHERE user_id = auth.uid()::text)
);

-- ===== ADD UPDATED_AT TRIGGERS =====
DROP TRIGGER IF EXISTS handle_updated_at_flashcard_sets ON flashcard_sets;
CREATE TRIGGER handle_updated_at_flashcard_sets BEFORE UPDATE ON flashcard_sets
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_flashcards ON flashcards;
CREATE TRIGGER handle_updated_at_flashcards BEFORE UPDATE ON flashcards
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_flashcard_progress ON flashcard_progress;
CREATE TRIGGER handle_updated_at_flashcard_progress BEFORE UPDATE ON flashcard_progress
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE '🃏 Existing flashcard tables updated successfully!';
    RAISE NOTICE '📚 Works with existing schema: flashcard_sets, flashcards, flashcard_progress, flashcard_sessions';
    RAISE NOTICE '➕ Added: flashcard_answers table for detailed tracking';
    RAISE NOTICE '🔒 Row Level Security policies updated with proper auth.uid()::text casting';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🎯 Compatible with existing data and ready for AI flashcard generation!';
END $$;