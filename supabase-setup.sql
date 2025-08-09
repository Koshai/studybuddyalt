-- Jaquizy Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ===== SUBJECTS TABLE =====
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert fixed subjects
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
ON CONFLICT (id) DO NOTHING;

-- ===== USER PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    last_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    subscription_status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TOPICS TABLE =====
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== NOTES TABLE =====
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_name TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== QUESTIONS TABLE =====
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    type TEXT DEFAULT 'multiple_choice',
    options JSONB,
    correct_index INTEGER,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PRACTICE SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    questions_count INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy_rate REAL DEFAULT 0,
    session_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== USER ANSWERS TABLE =====
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    time_taken INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== USER USAGE TABLE =====
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

-- ===== INDEXES FOR PERFORMANCE =====
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

-- ===== ROW LEVEL SECURITY POLICIES =====

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Subjects table is public (read-only for everyone)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are viewable by everyone" ON subjects FOR SELECT USING (true);

-- User profiles - users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Topics - users can only access their own topics
CREATE POLICY "Users can view own topics" ON topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topics" ON topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON topics FOR DELETE USING (auth.uid() = user_id);

-- Notes - users can only access notes from their topics
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

-- Questions - users can only access questions from their topics
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

-- Practice sessions - users can only access their own sessions
CREATE POLICY "Users can view own practice sessions" ON practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own practice sessions" ON practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own practice sessions" ON practice_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own practice sessions" ON practice_sessions FOR DELETE USING (auth.uid() = user_id);

-- User answers - users can only access answers from their sessions
CREATE POLICY "Users can view own answers" ON user_answers FOR SELECT USING (
    practice_session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own answers" ON user_answers FOR INSERT WITH CHECK (
    practice_session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid())
);

-- User usage - users can only access their own usage data
CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON user_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage FOR UPDATE USING (auth.uid() = user_id);

-- ===== FUNCTIONS =====

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
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
DROP TRIGGER IF EXISTS handle_updated_at ON user_profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON topics;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON notes;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON questions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON user_usage;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ===== STORAGE SETUP (for file uploads) =====

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials',
    false,
    50000000, -- 50MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for study materials
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
    RAISE NOTICE '✅ Jaquizy database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: subjects, user_profiles, topics, notes, questions, practice_sessions, user_answers, user_usage';
    RAISE NOTICE '🔒 Row Level Security enabled with proper policies';
    RAISE NOTICE '📁 Storage bucket created for file uploads';
    RAISE NOTICE '🎯 Ready for your Jaquizy web app!';
END $$;