const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/metrics', authenticateToken, adminController.getMetrics);
router.get('/disputes', authenticateToken, adminController.getDisputes);
router.post('/disputes/:applicationId/resolve', authenticateToken, adminController.resolveDispute);
router.get('/companies', authenticateToken, adminController.getCompanies);
router.post('/companies/:companyEmail/verify', authenticateToken, adminController.verifyCompany);

module.exports = router;
