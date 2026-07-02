const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/company-stats/:email', authenticateToken, controller.routeHandler0);
router.get('/recent-activity/:email', authenticateToken, controller.routeHandler1);

module.exports = router;