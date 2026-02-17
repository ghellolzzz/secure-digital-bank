const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);

const accountRoutes = require('./accountRoutes');
router.use('/accounts', accountRoutes);

const transferRoutes = require('./transferRoutes');
router.use('/transfers', transferRoutes);

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Secure Digital Bank API' });
});

module.exports = router;
