-- ===== FILES TABLE FOR STUDY MATERIALS =====
-- Track uploaded files for topics

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_topic_id ON files(topic_id);
CREATE INDEX IF NOT EXISTS idx_files_upload_date ON files(upload_date);

-- ===== ENABLE ROW LEVEL SECURITY =====
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- ===== ROW LEVEL SECURITY POLICIES =====
CREATE POLICY "Users can view own files" ON files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (auth.uid() = user_id);  
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (auth.uid() = user_id);

-- ===== UPDATED_AT TRIGGER =====
DROP TRIGGER IF EXISTS handle_updated_at_files ON files;
CREATE TRIGGER handle_updated_at_files 
    BEFORE UPDATE ON files 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ===== DEFAULT ID GENERATION =====
-- Set default for id column to generate UUID strings
ALTER TABLE files ALTER COLUMN id SET DEFAULT generate_uuid_string();

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE '📁 Files table created successfully!';
    RAISE NOTICE '🔧 Table: files with proper user/topic relationships';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '📤 Ready for file upload tracking!';
END $$;