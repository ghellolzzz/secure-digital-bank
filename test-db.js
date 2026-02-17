const db = require('./config/db');

async function testConnection() {
    try {
        const res = await db.query('SELECT NOW()');
        console.log('Database Connected Successfully!');
        console.log('Server Time:', res.rows[0].now);
        process.exit(0);
    } catch (err) {
        console.error('Database Connection Failed:', err);
        process.exit(1);
    }
}

testConnection();
