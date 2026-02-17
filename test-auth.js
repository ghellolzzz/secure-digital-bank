const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';
const TEST_USER = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'securePassword123!',
    fullName: 'Test User'
};

async function testAuthFlow() {
    try {
        // 1. Register
        console.log('Testing Registration...');
        const registerRes = await axios.post(`${BASE_URL}/register`, TEST_USER);
        console.log('Registration Success:', registerRes.data.message);

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        console.log('Login Success:', loginRes.data.message);
        const token = loginRes.data.token;

        // 3. Protected Route (Me)
        console.log('\nTesting Protected Route (/me)...');
        const meRes = await axios.get(`${BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Protected Route Success:', meRes.data.username === TEST_USER.username);

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

testAuthFlow();
