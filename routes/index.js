const express = require('express');
const router = express.Router();

// Placeholder for future routes
// router.use('/auth', authRoutes);
// router.use('/accounts', accountRoutes);

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Secure Digital Bank API' });
});

module.exports = router;
