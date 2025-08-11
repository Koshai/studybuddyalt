// find-user-id.js - Find user ID from email
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function findUserIdByEmail(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Try to get user by email from Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      
      // If Supabase is unreachable, try user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email)
        .single();
        
      if (profileError) {
        console.error('❌ Profile error:', profileError.message);
        return null;
      }
      
      if (profileData) {
        console.log('✅ Found user in profiles:', profileData.id);
        return profileData.id;
      }
    }
    
    if (authUser?.user) {
      console.log('✅ Found user in auth:', authUser.user.id);
      return authUser.user.id;
    }
    
    console.log('❌ User not found');
    return null;
    
  } catch (error) {
    console.error('❌ Error finding user:', error.message);
    
    // If network error, provide a fallback
    if (error.code === 'ENOTFOUND' || error.cause?.code === 'ENOTFOUND') {
      console.log('⚠️  Supabase unreachable. Using fallback user ID.');
      console.log('💡 You can manually provide your user ID if you know it.');
      return 'f629a691-afef-4d4f-b368-a3a4600405b7'; // From your logs
    }
    
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2] || 'syed.r.akbar@gmail.com';
  findUserIdByEmail(email).then(userId => {
    if (userId) {
      console.log('\n🎯 User ID found:', userId);
      console.log('\n📋 Next steps:');
      console.log(`1. Run: node generate-sample-data.js ${userId}`);
      console.log('2. Restart your server: npm start');
      console.log('3. Login and check dashboard/subjects');
    } else {
      console.log('\n❌ Could not find user ID');
      console.log('💡 Try checking your Supabase dashboard for the user ID');
    }
    process.exit(0);
  });
}

module.exports = { findUserIdByEmail };