// test-topic-creation.js - Test topic creation API
require('dotenv').config();

async function testTopicCreation() {
  console.log('🧪 Testing topic creation API...');
  
  try {
    // First, let's try to get an auth token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'syed.r.akbar@gmail.com',
        password: 'your-password' // You'll need your actual password
      }),
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login data:', loginData);
    
    if (loginData.status === 'success') {
      const token = loginData.tokens.accessToken;
      
      // Now test topic creation
      const createResponse = await fetch('http://localhost:3001/api/subjects/computer-science/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Test Topic API',
          description: 'Testing topic creation from API'
        }),
      });
      
      console.log('Create topic response status:', createResponse.status);
      console.log('Create topic response headers:', Object.fromEntries(createResponse.headers.entries()));
      
      const createData = await createResponse.json();
      console.log('Create topic data:', createData);
      
    } else {
      console.log('❌ Login failed, cannot test topic creation');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTopicCreation();