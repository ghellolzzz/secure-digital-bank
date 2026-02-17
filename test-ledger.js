const axios = require('axios');
const db = require('./config/db');

const BASE_URL = 'http://localhost:3000/api';
const AUTH_URL = `${BASE_URL}/auth`;
const ACCOUNTS_URL = `${BASE_URL}/accounts`;
const TRANSFERS_URL = `${BASE_URL}/transfers`;

async function setupUserWithAccount(prefix) {
    const user = {
        username: `${prefix}_${Date.now()}`,
        email: `${prefix}_${Date.now()}@example.com`,
        password: 'password123',
        fullName: `${prefix} User`
    };

    try {
        await axios.post(`${AUTH_URL}/register`, user);
        const res = await axios.post(`${AUTH_URL}/login`, { email: user.email, password: user.password });
        const token = res.data.token;

        const accRes = await axios.post(ACCOUNTS_URL, { type: 'CHECKING' }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return { token, accountId: accRes.data.account.id, userId: res.data.user.id };
    } catch (err) {
        console.error('Setup Failed for:', prefix);
        throw err;
    }
}

async function fundAccount(accountId, amount) {
    await db.query('UPDATE accounts SET balance = $1 WHERE id = $2', [amount, accountId]);
}

async function testLedgerFlow() {
    try {
        console.log('--- Setup Users ---');
        const userA = await setupUserWithAccount('ledger_sender');
        const userB = await setupUserWithAccount('ledger_receiver');

        console.log(`Funding User A with $200.00`);
        await fundAccount(userA.accountId, 200.00);

        // 1. Perform Transfer
        console.log('\n--- 1. Transfer $50.00 from A to B ---');
        const transferRes = await axios.post(TRANSFERS_URL, {
            fromAccountId: userA.accountId,
            toAccountId: userB.accountId,
            amount: 50.00
        }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        const transactionId = transferRes.data.transactionId;
        console.log('Transfer Success. Transaction ID:', transactionId);

        if (!transactionId) throw new Error('Transaction ID missing from response');

        // 2. Verify Ledger Entries in DB
        console.log('\n--- 2. Auditing Ledger Table ---');
        const ledgerRows = await db.query('SELECT * FROM ledger WHERE transaction_id = $1', [transactionId]);
        console.log(`Found ${ledgerRows.rows.length} ledger entries.`);

        if (ledgerRows.rows.length !== 2) throw new Error('Expected 2 ledger entries');

        const debitEntry = ledgerRows.rows.find(r => r.type === 'DEBIT');
        const creditEntry = ledgerRows.rows.find(r => r.type === 'CREDIT');

        console.log('Debit Entry:', debitEntry.amount, 'Account:', debitEntry.account_id);
        console.log('Credit Entry:', creditEntry.amount, 'Account:', creditEntry.account_id);

        if (debitEntry.account_id !== userA.accountId) throw new Error('Debit assigned to wrong account');
        if (creditEntry.account_id !== userB.accountId) throw new Error('Credit assigned to wrong account');
        if (debitEntry.amount !== '-50.00') throw new Error('Debit amount incorrect');
        if (creditEntry.amount !== '50.00') throw new Error('Credit amount incorrect');

        // 3. Verify API Access to History
        console.log('\n--- 3. Verifying API Access Info ---');
        const historyRes = await axios.get(`${ACCOUNTS_URL}/${userA.accountId}/history`, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        console.log('User A History Entries:', historyRes.data.length);
        if (historyRes.data.length < 1) throw new Error('History API returned no data');

        console.log('\n--- Phase 5 Verification Complete ---');
        process.exit(0);

    } catch (err) {
        if (err.response) {
            console.error('Test Failed (API Error):', JSON.stringify(err.response.data, null, 2));
            console.error('Status:', err.response.status);
        } else {
            console.error('Test Failed (Script Error):', err);
        }
        process.exit(1);
    }
}

testLedgerFlow();
