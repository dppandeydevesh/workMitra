const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });


router.post('/company', authenticateToken, controller.routeHandler0);
router.get('/company', authenticateToken, controller.routeHandler1);
router.post('/resume', authenticateToken, controller.routeHandler2);
router.post('/upload-cv', authenticateToken, upload.single('cvFile'), controller.routeHandler3);
router.post('/vouch', authenticateToken, controller.routeHandler4);
router.put('/student/:email', authenticateToken, controller.routeHandler5);

module.exports = router;