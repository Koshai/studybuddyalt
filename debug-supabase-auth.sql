-- Debug Supabase Auth Configuration
-- Run this in Supabase SQL Editor to diagnose registration issues

-- 1. Check auth.users table constraints and indexes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confupdtype,
    confdeltype,
    confmatchtype
FROM pg_constraint 
WHERE conrelid = 'auth.users'::regclass;

-- 2. Check if auth.users table exists and has proper structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check for any triggers on auth.users that might be causing issues
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- 4. Check RLS policies on auth.users (this might be the issue)
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 5. Check if there are any custom functions that might interfere
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth';

-- 6. Test if we can manually insert into auth.users (should fail - this is read-only)
-- This is just to see what the actual error is
-- INSERT INTO auth.users (email) VALUES ('test@test.com'); -- Don't actually run this

-- 7. Check auth configuration settings
SELECT * FROM auth.schema_migrations ORDER BY version;

-- 8. Check if email confirmation is properly configured
-- Look for auth settings in the dashboard or run:
-- This might not work depending on your setup
-- SELECT * FROM auth.config;

-- 9. Check user_profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 10. Check user_profiles RLS policies
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';