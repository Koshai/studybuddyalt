-- Create files table for document uploads
-- This table stores file metadata and extracted content

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    content TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_topic_id ON files(topic_id);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files table
CREATE POLICY "Users can view own files" ON files 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own files" ON files 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON files 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON files 
    FOR DELETE USING (auth.uid() = user_id);

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Files table created successfully!';
    RAISE NOTICE '📁 Table: files';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '🎯 Ready for file uploads!';
END $$;