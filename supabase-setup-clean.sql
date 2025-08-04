-- Clean Supabase Setup SQL - Matching SQLite Schema
-- Run these commands in your Supabase SQL editor

-- First, drop all existing tables to start fresh
DROP TABLE IF EXISTS user_answers CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table (for Supabase auth integration)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table (read-only reference data) - matches SQLite FIXED_SUBJECTS
CREATE TABLE subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert fixed subjects matching SQLite schema
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
('other', 'General Studies', 'Engineering, Agriculture, Specialized fields, Miscellaneous', 'fas fa-graduation-cap', 'bg-gray-500');

-- Create topics table - matches SQLite schema exactly
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table - matches SQLite schema exactly
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_name TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table - matches SQLite schema exactly
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    type TEXT DEFAULT 'multiple_choice',
    options TEXT, -- JSON as TEXT to match SQLite
    correct_index INTEGER,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_sessions table - matches SQLite schema exactly
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    questions_count INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    session_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_answers table - matches SQLite schema exactly
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    time_taken INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance - matches SQLite indexes
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_notes_topic_id ON notes(topic_id);
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_practice_sessions_topic_id ON practice_sessions(topic_id);
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_session_id ON user_answers(practice_session_id);

-- Enable RLS (Row Level Security) after tables are created
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- subjects table is public (no RLS needed - everyone can read)
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;

-- topics policies
CREATE POLICY "Users can view own topics" ON topics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own topics" ON topics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics" ON topics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics" ON topics
    FOR DELETE USING (auth.uid() = user_id);

-- notes policies (through topics relationship)
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create own notes" ON notes
    FOR INSERT WITH CHECK (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

-- questions policies (through topics relationship)
CREATE POLICY "Users can view own questions" ON questions
    FOR SELECT USING (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create own questions" ON questions
    FOR INSERT WITH CHECK (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own questions" ON questions
    FOR UPDATE USING (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own questions" ON questions
    FOR DELETE USING (
        topic_id IN (SELECT id FROM topics WHERE user_id = auth.uid())
    );

-- practice_sessions policies
CREATE POLICY "Users can view own practice sessions" ON practice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_answers policies (through questions relationship)
CREATE POLICY "Users can view own answers" ON user_answers
    FOR SELECT USING (
        question_id IN (
            SELECT q.id FROM questions q
            JOIN topics t ON q.topic_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own answers" ON user_answers
    FOR INSERT WITH CHECK (
        question_id IN (
            SELECT q.id FROM questions q
            JOIN topics t ON q.topic_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables that have updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: SQLite doesn't have updated_at on notes, questions, practice_sessions, user_answers
-- so we don't add triggers for them to maintain compatibility