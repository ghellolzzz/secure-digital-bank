const db = require('../config/db');

class Ledger {
    static async recordTransfer({ fromAccountId, toAccountId, amount, transactionId, description }) {
        // We will execute two inserts here.
        // Ideally this should be part of a transaction, but for now we are just recording.

        // 1. Debit the Sender (Negative Amount)
        const debitQuery = `
      INSERT INTO ledger (transaction_id, account_id, amount, type, description)
      VALUES ($1, $2, $3, 'DEBIT', $4)
    `;
        await db.query(debitQuery, [transactionId, fromAccountId, -amount, description]);

        // 2. Credit the Receiver (Positive Amount)
        const creditQuery = `
      INSERT INTO ledger (transaction_id, account_id, amount, type, description)
      VALUES ($1, $2, $3, 'CREDIT', $4)
    `;
        await db.query(creditQuery, [transactionId, toAccountId, amount, description]);
    }

    static async getAccountHistory(accountId) {
        const query = `SELECT * FROM ledger WHERE account_id = $1 ORDER BY created_at DESC`;
        const result = await db.query(query, [accountId]);
        return result.rows;
    }
}

module.exports = Ledger;
