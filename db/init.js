const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running Schema Initialization...');
        await db.query(schemaSql);
        console.log('Schema applied successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

initDb();
