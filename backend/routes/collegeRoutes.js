const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/students/:collegeName', authenticateToken, collegeController.getStudents);
router.post('/endorse', authenticateToken, collegeController.endorseStudent);
router.get('/companies', authenticateToken, collegeController.getCompanies);
router.post('/toggle-company', authenticateToken, collegeController.toggleCompanyStatus);
router.post('/bulk-import', authenticateToken, collegeController.bulkImportStudents);

module.exports = router;
