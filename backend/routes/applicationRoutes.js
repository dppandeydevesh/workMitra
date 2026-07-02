const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/apply', authenticateToken, applicationController.applyForProject);
router.get('/student/:email', authenticateToken, applicationController.getStudentApplications);
router.get('/company/:email', authenticateToken, applicationController.getCompanyApplications);
router.get('/student-details/:email', authenticateToken, applicationController.getStudentDetails);
router.post('/:applicationId/status', authenticateToken, applicationController.updateStatus);
router.post('/:applicationId/submit', authenticateToken, applicationController.submitApplicationWork);
router.post('/:applicationId/request-extension', authenticateToken, applicationController.requestExtension);
router.post('/:applicationId/review-extension', authenticateToken, applicationController.reviewExtension);
router.post('/:applicationId/complete', authenticateToken, applicationController.completeApplication);
router.post('/:applicationId/revision', authenticateToken, applicationController.requestRevision);
router.put('/withdraw/:id', authenticateToken, applicationController.withdrawApplication);
router.post('/:applicationId/dispute', authenticateToken, applicationController.fileDispute);

module.exports = router;
