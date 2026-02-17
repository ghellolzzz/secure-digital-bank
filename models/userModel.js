const db = require('../config/db');

class User {
    static async create({ username, email, passwordHash, fullName }) {
        const query = `
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, full_name, created_at;
    `;
        const values = [username, email, passwordHash, fullName];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (err) {
            if (err.code === '23505') { // Unique violation
                throw new Error('Username or Email already exists');
            }
            throw err;
        }
    }

    static async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `SELECT id, username, email, full_name, created_at FROM users WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = User;
