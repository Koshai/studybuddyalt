const axios = require('axios');

class SimpleAuthTest {
    constructor() {
        this.baseURL = 'http://localhost:3001/api/auth';
        this.testUser = {
            email: 'test@studyai.com',
            password: 'testpassword123'
        };
        this.tokens = null;
    }

    async runQuickTest() {
        console.log('🧪 Quick Authentication Test\n');
        
        try {
            console.log('🔄 Step 1: Testing service...');
            await this.testService();
            
            console.log('\n🔄 Step 2: Testing login with existing user...');
            await this.testExistingUserLogin();
            
            console.log('\n🔄 Step 3: Testing protected route...');
            await this.testProtectedRoute();
            
            console.log('\n✅ Authentication system is working correctly!');
            console.log('\n📋 Summary:');
            console.log('   ✅ Auth service online');
            console.log('   ✅ User login successful');
            console.log('   ✅ Protected routes working');
            console.log('   ✅ JWT tokens functioning');
            
        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
            console.log('\n🔧 Troubleshooting tips:');
            console.log('   1. Make sure server is running on port 3001');
            console.log('   2. Check Supabase credentials in .env');
            console.log('   3. Verify test user exists in Supabase');
            console.log('   4. Wait a minute and try again (rate limiting)');
        }
    }

    async testService() {
        try {
            const response = await axios.get(`${this.baseURL}/test`);
            if (response.data.status === 'success') {
                console.log('   ✅ Auth service responding');
            }
        } catch (error) {
            throw new Error(`Service not responding: ${error.message}`);
        }
    }

    async testExistingUserLogin() {
        try {
            const response = await axios.post(`${this.baseURL}/login`, this.testUser);
            
            if (response.data.status === 'success') {
                this.tokens = response.data.tokens;
                console.log('   ✅ Login successful');
                console.log(`   📧 User: ${response.data.user.email}`);
                console.log(`   🎫 Tier: ${response.data.user.subscriptionTier}`);
                console.log(`   🔑 Token: ${this.tokens.accessToken.substring(0, 20)}...`);
            } else {
                throw new Error('Login failed - invalid response');
            }
        } catch (error) {
            if (error.response?.status === 429) {
                throw new Error('Rate limited - wait a minute and try again');
            } else if (error.response?.status === 401) {
                throw new Error('Invalid credentials - user might not exist');
            } else {
                throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
            }
        }
    }

    async testProtectedRoute() {
        if (!this.tokens) {
            throw new Error('No tokens available for protected route test');
        }
        
        try {
            const response = await axios.get(`${this.baseURL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            
            console.log('   ✅ Protected route accessible');
            console.log(`   👤 User ID: ${response.data.user.id}`);
            console.log(`   📊 Usage: ${response.data.usage.questions.used}/${response.data.usage.questions.limit} questions`);
            console.log(`   💾 Storage: ${response.data.usage.storage.usedMB}/${response.data.usage.storage.limitMB} MB`);
            
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error('JWT token validation failed');
            } else {
                throw new Error(`Protected route failed: ${error.message}`);
            }
        }
    }
}

// Test registration with a truly unique user
class RegistrationTest {
    constructor() {
        this.baseURL = 'http://localhost:3001/api/auth';
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.testUser = {
            email: `test.${uniqueId}@studyai.com`,
            password: 'testpassword123',
            firstName: 'Test',
            lastName: 'User',
            username: `testuser${uniqueId}`
        };
    }

    async testRegistration() {
        console.log('🧪 Testing New User Registration\n');
        
        try {
            console.log('📧 Creating user:', this.testUser.email);
            
            const response = await axios.post(`${this.baseURL}/register`, this.testUser);
            
            if (response.data.status === 'success') {
                console.log('✅ Registration successful!');
                console.log(`   📧 Email: ${response.data.user.email}`);
                console.log(`   👤 ID: ${response.data.user.id}`);
                console.log(`   🎫 Tier: ${response.data.user.subscriptionTier}`);
                
                // Test immediate login with new user
                const loginResponse = await axios.post(`${this.baseURL}/login`, {
                    email: this.testUser.email,
                    password: this.testUser.password
                });
                
                if (loginResponse.data.status === 'success') {
                    console.log('✅ Immediate login after registration works!');
                }
                
            } else {
                console.error('❌ Registration failed - invalid response');
            }
            
        } catch (error) {
            if (error.response?.status === 429) {
                console.error('❌ Rate limited - wait and try again');
            } else {
                console.error('❌ Registration failed:', error.response?.data?.message || error.message);
            }
        }
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--register')) {
        const test = new RegistrationTest();
        test.testRegistration();
    } else {
        const test = new SimpleAuthTest();
        test.runQuickTest();
    }
}

module.exports = { SimpleAuthTest, RegistrationTest };