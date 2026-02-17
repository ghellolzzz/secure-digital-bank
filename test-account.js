const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const AUTH_URL = `${BASE_URL}/auth`;
const ACCOUNTS_URL = `${BASE_URL}/accounts`;

// Unique users for this run
const USER_A = {
    username: `usera_${Date.now()}`,
    email: `usera_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'User A'
};

const USER_B = {
    username: `userb_${Date.now()}`,
    email: `userb_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'User B'
};

async function getAuthToken(user) {
    await axios.post(`${AUTH_URL}/register`, user);
    const res = await axios.post(`${AUTH_URL}/login`, { email: user.email, password: user.password });
    return res.data.token;
}

async function testAccountFlow() {
    try {
        console.log('--- Setup Users ---');
        const tokenA = await getAuthToken(USER_A);
        const tokenB = await getAuthToken(USER_B);
        console.log('Users A and B registered and logged in.');

        // 1. Create Account for User A
        console.log('\n--- 1. Create Account (User A) ---');
        const createRes = await axios.post(ACCOUNTS_URL, { type: 'SAVINGS' }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log('Account Created:', createRes.data.account.account_number);
        const accountIdA = createRes.data.account.id;

        // 2. List Accounts for User A
        console.log('\n--- 2. List Accounts (User A) ---');
        const listRes = await axios.get(ACCOUNTS_URL, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log('Account List Count:', listRes.data.length);
        if (listRes.data.length !== 1) throw new Error('Expected 1 account');

        // 3. Security Check: User B tries to access User A's account
        console.log('\n--- 3. Security Check (User B accessing A) ---');
        try {
            await axios.get(`${ACCOUNTS_URL}/${accountIdA}`, {
                headers: { Authorization: `Bearer ${tokenB}` }
            });
            throw new Error('SECURITY FAILURE: User B accessed User A details!');
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log('SUCCESS: Access Denied (403) as expected.');
            } else {
                throw err;
            }
        }

        console.log('\n--- Phase 3 Verification Complete ---');

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

testAccountFlow();
