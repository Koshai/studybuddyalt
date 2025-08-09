-- Jaquizy Supabase Table Updates
-- Run this SQL in your Supabase SQL Editor to update existing tables

-- ===== UPDATE EXISTING TABLES SAFELY =====

-- Add missing columns to existing tables (won't error if they already exist)

-- Update subjects table structure
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='icon') THEN
        ALTER TABLE subjects ADD COLUMN icon TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='color') THEN
        ALTER TABLE subjects ADD COLUMN color TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='created_at') THEN
        ALTER TABLE subjects ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='updated_at') THEN
        ALTER TABLE subjects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update user_profiles table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='username') THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_name') THEN
        ALTER TABLE user_profiles ADD COLUMN last_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_login') THEN
        ALTER TABLE user_profiles ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    -- Update subscription_tier constraint if it exists
    ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_tier_check 
        CHECK (subscription_tier IN ('free', 'pro', 'premium'));
END $$;

-- Update topics table structure
DO $$
BEGIN
    -- Make sure user_id column exists and has proper type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topics' AND column_name='user_id' AND data_type != 'uuid') THEN
        -- If user_id exists but wrong type, we need to be careful
        RAISE NOTICE 'Warning: user_id column exists but may need type conversion';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topics' AND column_name='user_id') THEN
        ALTER TABLE topics ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topics' AND column_name='updated_at') THEN
        ALTER TABLE topics ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update notes table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='updated_at') THEN
        ALTER TABLE notes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update questions table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='note_id') THEN
        ALTER TABLE questions ADD COLUMN note_id UUID REFERENCES notes(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='updated_at') THEN
        ALTER TABLE questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Change options to JSONB if it's TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='options' AND data_type = 'text') THEN
        ALTER TABLE questions ALTER COLUMN options TYPE JSONB USING options::JSONB;
    END IF;
END $$;

-- Update practice_sessions table structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_sessions' AND column_name='user_id') THEN
        ALTER TABLE practice_sessions ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Rename session_date to created_at if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_sessions' AND column_name='session_date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_sessions' AND column_name='created_at') THEN
        ALTER TABLE practice_sessions RENAME COLUMN session_date TO created_at;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='practice_sessions' AND column_name='session_date') THEN
        ALTER TABLE practice_sessions ADD COLUMN session_date TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Ensure user_usage table exists
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    questions_used INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    topics_created INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- ===== UPDATE/INSERT FIXED SUBJECTS =====
INSERT INTO subjects (id, name, description, icon, color) VALUES
('mathematics', 'Mathematics', 'Algebra, Calculus, Statistics, Geometry, Arithmetic', 'fas fa-calculator', 'bg-blue-500'),
('natural-sciences', 'Natural Sciences', 'Physics, Chemistry, Biology, Earth Science', 'fas fa-atom', 'bg-green-500'),
('literature', 'Literature & Writing', 'English, Creative Writing, Poetry, Drama, Reading', 'fas fa-book-open', 'bg-purple-500'),
('history', 'History & Social Studies', 'World History, Government, Geography, Economics', 'fas fa-landmark', 'bg-amber-500'),
('languages', 'Foreign Languages', 'Spanish, French, German, Chinese, Language Learning', 'fas fa-language', 'bg-red-500'),
('arts', 'Arts & Humanities', 'Art History, Music, Philosophy, Theater, Culture', 'fas fa-palette', 'bg-pink-500'),
('computer-science', 'Computer Science', 'Programming, Algorithms, Data Structures, Technology', 'fas fa-code', 'bg-indigo-500'),
('business', 'Business & Economics', 'Finance, Marketing, Management, Economics, Trade', 'fas fa-chart-line', 'bg-emerald-500'),
('health-medicine', 'Health & Medicine', 'Anatomy, Nursing, Public Health, Psychology, Wellness', 'fas fa-heartbeat', 'bg-rose-500'),
('other', 'General Studies', 'Engineering, Agriculture, Specialized fields, Miscellaneous', 'fas fa-graduation-cap', 'bg-gray-500')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- ===== CREATE MISSING INDEXES =====
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_note_id ON questions(note_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_topic_id ON practice_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON user_answers(practice_session_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- ===== UPDATE ROW LEVEL SECURITY =====

-- Enable RLS on all tables if not already enabled
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them (safer than checking if they exist)
DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON subjects;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own topics" ON topics;
DROP POLICY IF EXISTS "Users can insert own topics" ON topics;
DROP POLICY IF EXISTS "Users can update own topics" ON topics;
DROP POLICY IF EXISTS "Users can delete own topics" ON topics;
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert notes to own topics" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
DROP POLICY IF EXISTS "Users can view own questions" ON questions;
DROP POLICY IF EXISTS "Users can insert questions to own topics" ON questions;
DROP POLICY IF EXISTS "Users can update own questions" ON questions;
DROP POLICY IF EXISTS "Users can delete own questions" ON questions;
DROP POLICY IF EXISTS "Users can view own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can update own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can delete own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view own answers" ON user_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON user_answers;
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;

-- Recreate all policies
CREATE POLICY "Subjects are viewable by everyone" ON subjects FOR SELECT USING (true);

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own topics" ON topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topics" ON topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON topics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert notes to own topics" ON notes FOR INSERT WITH CHECK (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own questions" ON questions FOR SELECT USING (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert questions to own topics" ON questions FOR INSERT WITH CHECK (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own questions" ON questions FOR UPDATE USING (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own questions" ON questions FOR DELETE USING (
    topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own practice sessions" ON practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own practice sessions" ON practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own practice sessions" ON practice_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own practice sessions" ON practice_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own answers" ON user_answers FOR SELECT USING (
    practice_session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own answers" ON user_answers FOR INSERT WITH CHECK (
    practice_session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON user_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage FOR UPDATE USING (auth.uid() = user_id);

-- ===== UPDATE/CREATE FUNCTIONS =====

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON user_profiles;
CREATE TRIGGER handle_updated_at_user_profiles BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_topics ON topics;
CREATE TRIGGER handle_updated_at_topics BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_notes ON notes;
CREATE TRIGGER handle_updated_at_notes BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_questions ON questions;
CREATE TRIGGER handle_updated_at_questions BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_usage ON user_usage;
CREATE TRIGGER handle_updated_at_user_usage BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ===== STORAGE SETUP (if not exists) =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials',
    false,
    50000000, -- 50MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'study-materials' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (
    bucket_id = 'study-materials' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (
    bucket_id = 'study-materials' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE '✅ Jaquizy database update completed successfully!';
    RAISE NOTICE '🔄 Existing tables updated with new columns and constraints';
    RAISE NOTICE '📊 Fixed subjects updated with icons and colors';
    RAISE NOTICE '🔒 Row Level Security policies updated';
    RAISE NOTICE '📁 Storage bucket and policies configured';
    RAISE NOTICE '🎯 Your existing data is preserved and ready for Jaquizy web app!';
END $$;