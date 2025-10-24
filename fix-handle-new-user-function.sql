-- Fix the handle_new_user() trigger function
-- This replaces the broken function with a working one

-- First, drop the existing broken function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create a new working function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into user_profiles table
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    username,
    subscription_tier,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    'free', -- Default subscription tier
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Test the fix by checking if we can create a test user
-- (Remove this line after testing)
-- INSERT INTO auth.users (email) VALUES ('test@test.com');