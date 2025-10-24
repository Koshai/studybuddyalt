-- Debug the handle_new_user() trigger function
-- Run this in Supabase SQL Editor to find the issue

-- 1. Check if the function exists and see its definition
SELECT routine_name, routine_definition, routine_body
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

-- 2. Get the full function source code
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Check what tables the function might be trying to access
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 4. Test if we can manually run the function (will show the actual error)
-- This will fail but show us the exact error message:
-- SELECT handle_new_user();

-- 5. Check if user_profiles table has all required columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;