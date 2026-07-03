const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authenticateToken = require('../middleware/authMiddleware');

// ==========================================
// 🚀 RESTful API V2 (Modern Standards)
// ==========================================
router.post('/', authenticateToken, applicationController.applyForProject); // Replaces /apply
router.get('/student', authenticateToken, applicationController.getStudentApplications); // Context from JWT instead of URL param
router.get('/company', authenticateToken, applicationController.getCompanyApplications); // Context from JWT
router.get('/student-details', authenticateToken, applicationController.getStudentDetails); 
router.patch('/:applicationId/status', authenticateToken, applicationController.updateStatus);
router.patch('/:applicationId/submit', authenticateToken, applicationController.submitApplicationWork);
router.patch('/:applicationId/extension', authenticateToken, applicationController.requestExtension);
router.patch('/:applicationId/extension/review', authenticateToken, applicationController.reviewExtension);
router.patch('/:applicationId/complete', authenticateToken, applicationController.completeApplication);
router.patch('/:applicationId/revision', authenticateToken, applicationController.requestRevision);
router.patch('/:applicationId/withdraw', authenticateToken, applicationController.withdrawApplication);
router.patch('/:applicationId/dispute', authenticateToken, applicationController.fileDispute);
router.patch('/:applicationId/placement/offer', authenticateToken, applicationController.offerPlacement);
router.patch('/:applicationId/placement/resolve', authenticateToken, applicationController.resolvePlacementOffer);
router.patch('/:applicationId/pipeline', authenticateToken, applicationController.updatePipelineStatus);

// ==========================================
// 🏚️ Legacy RPC Routes (Maintained for Frontend Compatibility)
// ==========================================
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
router.post('/:applicationId/offer-placement', authenticateToken, applicationController.offerPlacement);
router.post('/:applicationId/resolve-offer', authenticateToken, applicationController.resolvePlacementOffer);
router.post('/:applicationId/update-pipeline', authenticateToken, applicationController.updatePipelineStatus);

module.exports = router;
