const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/all', authenticateToken, projectController.getAllProjects);
router.post('/', authenticateToken, projectController.createProject);
router.get('/recommended', authenticateToken, projectController.getRecommendedProjects);
router.get('/:projectId', authenticateToken, projectController.getProjectById);
router.get('/company/:email', authenticateToken, projectController.getProjectsByCompany);
router.get('/:projectId/applicants', authenticateToken, projectController.getProjectApplicants);
router.put('/:projectId', authenticateToken, projectController.updateProject);
router.delete('/:projectId', authenticateToken, projectController.deleteProject);

module.exports = router;
