const express = require('express');
const router = express.Router();
const { getAlerts } = require('../controllers/alertController');

// Retrieve paginated security alerts
router.get('/', getAlerts);

module.exports = router;
