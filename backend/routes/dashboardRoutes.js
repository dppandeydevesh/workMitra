const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/company-stats/:email', authenticateToken, controller.getCompanyStats);
router.get('/recent-activity/:email', authenticateToken, controller.getRecentActivity);

module.exports = router;