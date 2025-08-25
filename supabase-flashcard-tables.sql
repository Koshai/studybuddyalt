-- Jaquizy Flashcard Tables for Supabase
-- Run this SQL in your Supabase SQL Editor to add flashcard functionality

-- ===== FLASHCARD SETS TABLE =====
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id TEXT PRIMARY KEY, -- Using TEXT to match WebStorageService uuidv4() string generation
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subject_id TEXT REFERENCES subjects(id),
    topic_id UUID REFERENCES topics(id),
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FLASHCARDS TABLE =====
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY, -- Using TEXT to match the pattern
    set_id TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    hint TEXT,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty IN (1, 2, 3)),
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FLASHCARD STUDY SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
    id TEXT PRIMARY KEY, -- Using TEXT for consistency
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    set_id TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    study_mode TEXT DEFAULT 'recognition',
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    session_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FLASHCARD ANSWERS TABLE =====
CREATE TABLE IF NOT EXISTS flashcard_answers (
    id TEXT PRIMARY KEY, -- Using TEXT for consistency  
    session_id TEXT NOT NULL REFERENCES flashcard_study_sessions(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER, -- milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FLASHCARD PROGRESS TABLE =====
CREATE TABLE IF NOT EXISTS flashcard_progress (
    id TEXT PRIMARY KEY, -- Using TEXT for consistency
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, 
    card_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    times_studied INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_studied TIMESTAMPTZ,
    difficulty_level INTEGER DEFAULT 1,
    next_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- ===== CREATE INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_subject_id ON flashcard_sets(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_topic_id ON flashcard_sets(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_user_id ON flashcard_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_set_id ON flashcard_study_sessions(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_answers_session_id ON flashcard_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_answers_card_id ON flashcard_answers(card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id ON flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_card_id ON flashcard_progress(card_id);

-- ===== ENABLE ROW LEVEL SECURITY =====
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

-- ===== CREATE ROW LEVEL SECURITY POLICIES =====

-- Flashcard Sets Policies
CREATE POLICY "Users can view own flashcard sets" ON flashcard_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcard sets" ON flashcard_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard sets" ON flashcard_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcard sets" ON flashcard_sets FOR DELETE USING (auth.uid() = user_id);

-- Flashcards Policies
CREATE POLICY "Users can view own flashcards" ON flashcards FOR SELECT USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert flashcards to own sets" ON flashcards FOR INSERT WITH CHECK (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own flashcards" ON flashcards FOR UPDATE USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own flashcards" ON flashcards FOR DELETE USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid())
);

-- Flashcard Study Sessions Policies
CREATE POLICY "Users can view own study sessions" ON flashcard_study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON flashcard_study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sessions" ON flashcard_study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study sessions" ON flashcard_study_sessions FOR DELETE USING (auth.uid() = user_id);

-- Flashcard Answers Policies
CREATE POLICY "Users can view own flashcard answers" ON flashcard_answers FOR SELECT USING (
    session_id IN (SELECT id FROM flashcard_study_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own flashcard answers" ON flashcard_answers FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM flashcard_study_sessions WHERE user_id = auth.uid())
);

-- Flashcard Progress Policies
CREATE POLICY "Users can view own flashcard progress" ON flashcard_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcard progress" ON flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard progress" ON flashcard_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcard progress" ON flashcard_progress FOR DELETE USING (auth.uid() = user_id);

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

-- ===== HELPER FUNCTIONS =====

-- Function to generate UUID-like strings for compatibility with WebStorageService
CREATE OR REPLACE FUNCTION generate_uuid_string()
RETURNS TEXT AS $$
BEGIN
    -- Generate a UUID and cast to text to match WebStorageService pattern
    RETURN gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

-- Add default values for ID columns that need them
ALTER TABLE flashcard_sets ALTER COLUMN id SET DEFAULT generate_uuid_string();
ALTER TABLE flashcards ALTER COLUMN id SET DEFAULT generate_uuid_string();
ALTER TABLE flashcard_study_sessions ALTER COLUMN id SET DEFAULT generate_uuid_string();
ALTER TABLE flashcard_answers ALTER COLUMN id SET DEFAULT generate_uuid_string();
ALTER TABLE flashcard_progress ALTER COLUMN id SET DEFAULT generate_uuid_string();

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE '🃏 Flashcard tables created successfully!';
    RAISE NOTICE '📚 Tables: flashcard_sets, flashcards, flashcard_study_sessions, flashcard_answers, flashcard_progress';
    RAISE NOTICE '🔧 Data types: TEXT IDs to match WebStorageService uuidv4() strings';
    RAISE NOTICE '🔒 Row Level Security enabled with proper user isolation';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🎯 Ready for AI flashcard generation!';
END $$;