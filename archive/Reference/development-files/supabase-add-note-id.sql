-- Add note_id column to questions table for note-specific questions
-- Run this in Supabase SQL Editor

-- Add the note_id column to questions table
ALTER TABLE questions ADD COLUMN note_id UUID;

-- Add foreign key constraint (optional but recommended)
-- This creates a relationship between questions and notes
ALTER TABLE questions 
ADD CONSTRAINT fk_questions_note_id 
FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;

-- Create index for better performance when querying by note_id
CREATE INDEX IF NOT EXISTS idx_questions_note_id ON questions(note_id);

-- Add endpoints for getting notes by different scopes
-- These are handled by the backend, no additional SQL needed

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;