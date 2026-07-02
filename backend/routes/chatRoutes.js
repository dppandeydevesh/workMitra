const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/history/:user1/:user2', authenticateToken, controller.routeHandler0);
router.get('/partners/:email', authenticateToken, controller.routeHandler1);
router.post('/read', authenticateToken, controller.routeHandler2);

module.exports = router;