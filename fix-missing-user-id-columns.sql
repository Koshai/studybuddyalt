-- Fix Missing user_id Columns in Supabase
-- This adds the critical missing columns that prevent data from showing

-- =============================================================================
-- FIX 1: Add user_id column to notes table
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notes ADD COLUMN user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id column to notes table';
    ELSE
        RAISE NOTICE '⚠️ user_id column already exists in notes table - skipping';
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- =============================================================================
-- FIX 2: Add user_id column to questions table  
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE questions ADD COLUMN user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id column to questions table';
    ELSE
        RAISE NOTICE '⚠️ user_id column already exists in questions table - skipping';
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);

-- =============================================================================
-- FIX 3: Update RLS policies to use user_id
-- =============================================================================

-- Update notes policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own notes" ON notes;
    DROP POLICY IF EXISTS "Users can create own notes" ON notes;  
    DROP POLICY IF EXISTS "Users can update own notes" ON notes;
    DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

    -- Create new policies using user_id
    CREATE POLICY "Users can view own notes" ON notes
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create own notes" ON notes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
    CREATE POLICY "Users can update own notes" ON notes
        FOR UPDATE USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can delete own notes" ON notes
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE '✅ Updated RLS policies for notes table';
END $$;

-- Update questions policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own questions" ON questions;
    DROP POLICY IF EXISTS "Users can create own questions" ON questions;
    DROP POLICY IF EXISTS "Users can update own questions" ON questions;
    DROP POLICY IF EXISTS "Users can delete own questions" ON questions;

    -- Create new policies using user_id
    CREATE POLICY "Users can view own questions" ON questions
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create own questions" ON questions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
    CREATE POLICY "Users can update own questions" ON questions
        FOR UPDATE USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can delete own questions" ON questions
        FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE '✅ Updated RLS policies for questions table';
END $$;

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

DO $$
DECLARE
    notes_has_user_id boolean;
    questions_has_user_id boolean;
BEGIN
    -- Check if user_id columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'user_id'
    ) INTO notes_has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'user_id'
    ) INTO questions_has_user_id;
    
    IF notes_has_user_id AND questions_has_user_id THEN
        RAISE NOTICE '🎉 SUCCESS: Both notes and questions now have user_id columns!';
        RAISE NOTICE '✅ Your imported data should now be visible in the app';
        RAISE NOTICE '🔄 Next step: Re-import your data with the new schema';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Missing user_id columns - notes: %, questions: %', 
            notes_has_user_id, questions_has_user_id;
    END IF;
END $$;