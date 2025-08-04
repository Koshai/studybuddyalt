-- Add missing foreign key constraint and index for note_id column
-- Run this in Supabase SQL Editor
-- This script safely adds only the missing constraints/indexes

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_questions_note_id' 
        AND table_name = 'questions'
    ) THEN
        ALTER TABLE questions 
        ADD CONSTRAINT fk_questions_note_id 
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint fk_questions_note_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_questions_note_id already exists';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_questions_note_id ON questions(note_id);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'questions';