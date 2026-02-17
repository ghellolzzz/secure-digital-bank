const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes here are protected
router.use(authenticateToken);

router.post('/', accountController.createAccount);
router.get('/', accountController.getMyAccounts);
router.get('/:id', accountController.getAccountById);

module.exports = router;
