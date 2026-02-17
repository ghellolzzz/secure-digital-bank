const db = require('../config/db');

class Transfer {
    static async create({ fromAccountId, toAccountId, amount }) {
        const query = `
      INSERT INTO transfers (from_account_id, to_account_id, amount)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
        const result = await db.query(query, [fromAccountId, toAccountId, amount]);
        return result.rows[0];
    }

    static async findByUserId(userId) {
        // Find transfers where the user owns either the source or destination account
        const query = `
      SELECT t.* 
      FROM transfers t
      JOIN accounts a1 ON t.from_account_id = a1.id
      JOIN accounts a2 ON t.to_account_id = a2.id
      WHERE a1.user_id = $1 OR a2.user_id = $1
      ORDER BY t.created_at DESC;
    `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }
}

module.exports = Transfer;
