const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', transferController.transferFunds);
router.get('/', transferController.getMyTransfers);

module.exports = router;
