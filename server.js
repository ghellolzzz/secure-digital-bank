const express = require('express');
const dotenv = require('dotenv');
const db = require('./config/db');
const routes = require('./routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Health Check Endpoint
app.get('/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'OK',
            db_time: result.rows[0].now,
            message: 'Server and Database are healthy'
        });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed'
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
