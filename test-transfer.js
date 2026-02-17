const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const AUTH_URL = `${BASE_URL}/auth`;
const ACCOUNTS_URL = `${BASE_URL}/accounts`;
const TRANSFERS_URL = `${BASE_URL}/transfers`;

// Helper to create user and account
async function setupUserWithAccount(prefix, initialDeposit = 0) { // Naive setup doesn't have deposit yet, so balance starts at 0.
    // We'll simulate a deposit by manually updating DB via SQL injection? No, we can't.
    // Wait, for this phase we have no way to ADD money!
    // Ah, the prompt said "Phase 4: Basic Transfers".
    // To test this, I need to hack the DB and give UserA some money.
    // Or I can use the generateAccountNumber to maybe... no.
    // I will write a small "admin" hack in the server just for testing?
    // No, I'll use a direct DB query in this script since I have db access in the project.

    const user = {
        username: `${prefix}_${Date.now()}`,
        email: `${prefix}_${Date.now()}@example.com`,
        password: 'password123',
        fullName: `${prefix} User`
    };

    await axios.post(`${AUTH_URL}/register`, user);
    const res = await axios.post(`${AUTH_URL}/login`, { email: user.email, password: user.password });
    const token = res.data.token;

    const accRes = await axios.post(ACCOUNTS_URL, { type: 'CHECKING' }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return { token, accountId: accRes.data.account.id };
}

// Since we don't have a Deposit endpoint yet, we'll manually cheat for testing
const db = require('./config/db');

async function fundAccount(accountId, amount) {
    await db.query('UPDATE accounts SET balance = $1 WHERE id = $2', [amount, accountId]);
}

async function testTransferFlow() {
    try {
        console.log('--- Setup Users ---');
        const userA = await setupUserWithAccount('transfer_sender');
        const userB = await setupUserWithAccount('transfer_receiver');

        console.log(`Funding User A with $100.00`);
        await fundAccount(userA.accountId, 100.00);

        // 1. Valid Transfer
        console.log('\n--- 1. Transfer $40.00 from A to B ---');
        const transferRes = await axios.post(TRANSFERS_URL, {
            fromAccountId: userA.accountId,
            toAccountId: userB.accountId,
            amount: 40.00
        }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        console.log('Transfer Result:', transferRes.data.message);

        // Verify Balances
        const accA = await db.query('SELECT balance FROM accounts WHERE id = $1', [userA.accountId]);
        const accB = await db.query('SELECT balance FROM accounts WHERE id = $1', [userB.accountId]);

        console.log(`User A Balance: ${accA.rows[0].balance} (Expected 60.00)`);
        console.log(`User B Balance: ${accB.rows[0].balance} (Expected 40.00)`);

        if (accA.rows[0].balance !== '60.00' || accB.rows[0].balance !== '40.00') {
            throw new Error('Balance Mismatch!');
        }

        // 2. Insufficient Funds
        console.log('\n--- 2. Insufficient Funds Test ---');
        try {
            await axios.post(TRANSFERS_URL, {
                fromAccountId: userA.accountId,
                toAccountId: userB.accountId,
                amount: 1000.00
            }, {
                headers: { Authorization: `Bearer ${userA.token}` }
            });
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log('SUCCESS: Prevented overdraft (400 Bad Request)');
            } else {
                throw err;
            }
        }

        console.log('\n--- Phase 4 Verification Complete ---');
        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

testTransferFlow();
