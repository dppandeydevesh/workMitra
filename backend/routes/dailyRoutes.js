const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const dailyController = require('../controllers/dailyController');

router.get('/status', authenticateToken, dailyController.getStatus);
router.get('/question', authenticateToken, dailyController.getQuestion);
router.post('/question/answer', authenticateToken, dailyController.answerQuestion);
router.post('/track', authenticateToken, dailyController.trackTask);

// Unauthenticated — the signed token in the email link is the credential
router.get('/digest/unsubscribe', dailyController.unsubscribeDigest);

module.exports = router;
