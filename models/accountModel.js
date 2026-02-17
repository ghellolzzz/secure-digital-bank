const db = require('../config/db');
const { generateAccountNumber } = require('../utils/accountUtils');

class Account {
    static async create({ userId, type }) {
        let accountNumber;
        let isUnique = false;

        // Retry loop to ensure unique account number
        while (!isUnique) {
            accountNumber = generateAccountNumber();
            const existing = await db.query('SELECT id FROM accounts WHERE account_number = $1', [accountNumber]);
            if (existing.rows.length === 0) {
                isUnique = true;
            }
        }

        const query = `
      INSERT INTO accounts (user_id, account_number, account_type)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
        const result = await db.query(query, [userId, accountNumber, type]);
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const query = `SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    static async findById(id) {
        const query = `SELECT * FROM accounts WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async isOwner(accountId, userId) {
        const account = await this.findById(accountId);
        if (!account) return false;
        return account.user_id === userId;
    }
}

module.exports = Account;
