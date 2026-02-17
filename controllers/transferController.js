const Account = require('../models/accountModel');
const Transfer = require('../models/transferModel');
const Ledger = require('../models/ledgerModel');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.transferFunds = async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    const userId = req.user.id;

    if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Use a shared client for Transaction (ACID)
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN'); // Start Transaction

        // 1. Verify Ownership (Read is okay without look, but ideally FOR UPDATE if we were strict strict, 
        // but here we just need to ensure the user owns it)
        const isOwner = await Account.isOwner(fromAccountId, userId); // This uses default pool, which is fine for reading static data
        if (!isOwner) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Access denied to source account' });
        }

        // 2. Check Balance (Must use the transaction client to see latest state if we locked, 
        // here we are just reading. In a real real system we'd SELECT ... FOR UPDATE)
        // For this academic phase, verifying logic is more important than locking semantics, 
        // but let's be good citizens.
        const sourceRes = await client.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [fromAccountId]);
        const sourceAccount = sourceRes.rows[0];

        if (parseFloat(sourceAccount.balance) < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        // 3. Perform Updates (Atomic)
        // Step A: Deduct from Source
        await Account.updateBalance(fromAccountId, -amount, client);

        // Step B: Add to Destination
        await Account.updateBalance(toAccountId, amount, client);

        // Step C: Record Transfer (Naive Table)
        const transfer = await Transfer.create({ fromAccountId, toAccountId, amount }, client);

        // Step D: Record in Ledger (Double Entry)
        const transactionId = uuidv4();
        await Ledger.recordTransfer({
            fromAccountId,
            toAccountId,
            amount,
            transactionId,
            description: `Transfer from ${fromAccountId} to ${toAccountId}`
        }, client);

        await client.query('COMMIT'); // Commit Transaction

        res.json({ message: 'Transfer successful', transfer, transactionId });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on any error
        console.error(err);
        res.status(500).json({ message: 'Transaction failed', error: err.message });
    } finally {
        client.release(); // Release client back to pool
    }
};

exports.getMyTransfers = async (req, res) => {
    try {
        const transfers = await Transfer.findByUserId(req.user.id);
        res.json(transfers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching transfers' });
    }
};
