-- Supabase Setup SQL
-- Run these commands in your Supabase SQL editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table (read-only reference data)
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert fixed subjects
INSERT INTO subjects (id, name, description, icon, color) VALUES
('math', 'Mathematics', 'Algebra, Calculus, Geometry, Statistics', 'calculator', '#3B82F6'),
('science', 'Science', 'Physics, Chemistry, Biology', 'atom', '#10B981'),
('language', 'Language Arts', 'Literature, Writing, Grammar', 'book-open', '#8B5CF6'),
('history', 'History', 'World History, Literature, Social Studies', 'clock', '#F59E0B'),
('computer-science', 'Computer Science', 'Programming, Algorithms, Data Structures', 'code', '#EF4444'),
('business', 'Business', 'Economics, Marketing, Management', 'briefcase', '#06B6D4'),
('other', 'Other', 'Custom subjects and miscellaneous topics', 'folder', '#6B7280')
ON CONFLICT (id) DO NOTHING;

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    original_filename TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    type TEXT DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    options JSONB,
    correct_index INTEGER,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    questions_count INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN questions_count > 0 THEN (correct_answers::decimal / questions_count::decimal) * 100
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    questions_used INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0, -- in bytes
    topics_created INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_user_subject ON topics(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_topic ON notes(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_topic ON questions(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_topic ON practice_sessions(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security) after tables are created
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- topics policies
CREATE POLICY "Users can view own topics" ON topics
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own topics" ON topics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own topics" ON topics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own topics" ON topics
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- notes policies
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- questions policies
CREATE POLICY "Users can view own questions" ON questions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own questions" ON questions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own questions" ON questions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own questions" ON questions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- practice_sessions policies
CREATE POLICY "Users can view own practice sessions" ON practice_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- user_usage policies
CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own usage" ON user_usage
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Utility functions for usage tracking
CREATE OR REPLACE FUNCTION increment_storage_usage(p_user_id UUID, p_month_year TEXT, p_bytes BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage (user_id, month_year, storage_used, updated_at)
    VALUES (p_user_id, p_month_year, p_bytes, NOW())
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET 
        storage_used = user_usage.storage_used + p_bytes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_question_usage(p_user_id UUID, p_month_year TEXT, p_count INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage (user_id, month_year, questions_used, updated_at)
    VALUES (p_user_id, p_month_year, p_count, NOW())
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET 
        questions_used = user_usage.questions_used + p_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();