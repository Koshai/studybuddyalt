-- Fix missing INSERT policy for user_profiles table
-- This is blocking new user registration

-- Add missing INSERT policy for user_profiles
CREATE POLICY "Users can insert own profile" ON user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Also ensure service_role can insert (for registration service)
-- Note: The backend should be using service_role key which bypasses RLS,
-- but let's be explicit about permissions

-- Grant necessary permissions to service_role
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON topics TO service_role;
GRANT ALL ON notes TO service_role;
GRANT ALL ON questions TO service_role;
GRANT ALL ON practice_sessions TO service_role;
GRANT ALL ON user_answers TO service_role;
GRANT ALL ON usage_tracking TO service_role;

-- Verify the policies exist
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';