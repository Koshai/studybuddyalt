// test-auth.js (create in project root)
const axios = require('axios');

class AuthTester {
    constructor() {
        this.baseURL = 'http://localhost:3001/api/auth';
        this.testUser = {
            email: 'test@studyai.com',
            password: 'testpassword123',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser'
        };
        this.tokens = null;
    }

    async runAllTests() {
        console.log('🧪 Starting StudyAI Authentication Tests\n');
        
        try {
            await this.testServiceStatus();
            await this.testRegistration();
            await this.testLogin();
            await this.testProtectedRoute();
            await this.testProfileUpdate();
            await this.testTokenRefresh();
            await this.testProFeature();
            await this.testLogout();
            
            console.log('\n✅ All authentication tests passed!');
        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
            process.exit(1);
        }
    }

    async testServiceStatus() {
        console.log('🔄 Testing service status...');
        
        try {
            const response = await axios.get(`${this.baseURL}/test`);
            console.log('✅ Service status:', response.data.message);
        } catch (error) {
            throw new Error(`Service not responding: ${error.message}`);
        }
    }

    async testRegistration() {
        console.log('🔄 Testing user registration...');
        
        try {
            const response = await axios.post(`${this.baseURL}/register`, this.testUser);
            
            if (response.data.status === 'success') {
                this.tokens = response.data.tokens;
                console.log('✅ Registration successful:', response.data.user.email);
                console.log('   User ID:', response.data.user.id);
                console.log('   Subscription:', response.data.user.subscriptionTier);
            } else {
                throw new Error('Registration failed');
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                console.log('⚠️  User already exists, proceeding with login test...');
            } else {
                throw new Error(`Registration failed: ${error.response?.data?.message || error.message}`);
            }
        }
    }

    async testLogin() {
        console.log('🔄 Testing user login...');
        
        try {
            const response = await axios.post(`${this.baseURL}/login`, {
                email: this.testUser.email,
                password: this.testUser.password
            });
            
            if (response.data.status === 'success') {
                this.tokens = response.data.tokens;
                console.log('✅ Login successful:', response.data.user.email);
                console.log('   Access Token:', this.tokens.accessToken.substring(0, 20) + '...');
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testProtectedRoute() {
        console.log('🔄 Testing protected route access...');
        
        if (!this.tokens) {
            throw new Error('No access token available');
        }
        
        try {
            const response = await axios.get(`${this.baseURL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            
            console.log('✅ Protected route access successful');
            console.log('   User ID:', response.data.user.id);
            console.log('   Usage Stats:', {
                questions: `${response.data.usage.questions.used}/${response.data.usage.questions.limit}`,
                storage: `${response.data.usage.storage.usedMB}MB/${response.data.usage.storage.limitMB}MB`
            });
        } catch (error) {
            throw new Error(`Protected route failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testProfileUpdate() {
        console.log('🔄 Testing profile update...');
        
        try {
            const updateData = {
                firstName: 'Updated',
                lastName: 'TestUser'
            };
            
            const response = await axios.put(`${this.baseURL}/profile`, updateData, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            
            console.log('✅ Profile update successful');
            console.log('   Updated name:', response.data.user.first_name, response.data.user.last_name);
        } catch (error) {
            throw new Error(`Profile update failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testTokenRefresh() {
        console.log('🔄 Testing token refresh...');
        
        try {
            const response = await axios.post(`${this.baseURL}/refresh`, {
                refreshToken: this.tokens.refreshToken
            });
            
            if (response.data.status === 'success') {
                console.log('✅ Token refresh successful');
                console.log('   New Access Token:', response.data.tokens.accessToken.substring(0, 20) + '...');
                this.tokens = response.data.tokens; // Update tokens
            }
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testProFeature() {
        console.log('🔄 Testing Pro feature access (should fail for free user)...');
        
        try {
            const response = await axios.get(`${this.baseURL}/pro-feature`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            
            // This should fail for free users
            console.log('⚠️  Pro feature accessed (unexpected for free user)');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Pro feature correctly blocked for free user');
                console.log('   Error:', error.response.data.message);
            } else {
                throw new Error(`Unexpected pro feature test result: ${error.message}`);
            }
        }
    }

    async testLogout() {
        console.log('🔄 Testing logout...');
        
        try {
            const response = await axios.post(`${this.baseURL}/logout`, {
                refreshToken: this.tokens.refreshToken
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            
            console.log('✅ Logout successful');
        } catch (error) {
            throw new Error(`Logout failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new AuthTester();
    tester.runAllTests();
}

module.exports = AuthTester;
