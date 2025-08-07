# Manual Schema Fix Instructions

## Problem
Your imported data is not showing because the Supabase `notes` and `questions` tables are missing the `user_id` columns that exist in your local SQLite database.

## Solution
You need to manually add these columns through the Supabase dashboard:

### Step 1: Go to Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your Jaquizy project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Execute This SQL
Copy and paste this SQL into the SQL Editor and click "Run":

```sql
-- Add user_id column to notes table
ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Add user_id column to questions table  
ALTER TABLE questions ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_questions_user_id ON questions(user_id);

-- Update RLS policies for notes
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can create own notes" ON notes;  
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for questions
DROP POLICY IF EXISTS "Users can view own questions" ON questions;
DROP POLICY IF EXISTS "Users can create own questions" ON questions;
DROP POLICY IF EXISTS "Users can update own questions" ON questions;
DROP POLICY IF EXISTS "Users can delete own questions" ON questions;

CREATE POLICY "Users can view own questions" ON questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own questions" ON questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update own questions" ON questions
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete own questions" ON questions
    FOR DELETE USING (auth.uid() = user_id);
```

### Step 3: Re-import Your Data
After the SQL executes successfully, come back here and run:

```bash
node import-with-user-id.js
```

### Step 4: Verify
Once the import completes, go to https://jaquizy.com and log in. Your topics, notes, and questions should now appear!

## What This Does
1. **Adds user_id columns** to notes and questions tables
2. **Creates foreign key relationships** to ensure data integrity
3. **Adds database indexes** for better query performance
4. **Updates Row Level Security policies** so users can only see their own data

## Why This Happened
The original Supabase schema was missing these columns because the local SQLite database evolved over time during development, but the cloud schema wasn't updated to match.

## Next Steps After Fix
Once this is working, all future data sync will work automatically because both local and cloud databases will have matching schemas.