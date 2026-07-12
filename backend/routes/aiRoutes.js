/**
 * aiRoutes.js
 * All AI-powered endpoints for workMitra:
 * - Gemini CV review and ATS checking
 * - Project recommendations and semantic matching
 * - Mitra AI chat assistant
 * - Admin Pinecone backfill
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const aiController = require('../controllers/aiController');

// Memory-based multer for ATS resume check (no disk write needed) — 5MB cap
const memoryUpload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Semantic match — top Pinecone projects for a student
router.get('/semantic-match/:email', authenticateToken, aiController.semanticMatch);

// Admin: reindex all projects into Pinecone
router.post('/admin/pinecone-backfill', authenticateToken, aiController.pineconeBackfill);

// Project recommendations via Gemini AI
router.get('/recommendations/:email', authenticateToken, aiLimiter, aiController.getRecommendations);

// Mitra AI chat assistant
router.post('/chat', authenticateToken, aiLimiter, aiController.chat);

// CV critique via Gemini
router.post('/review-cv', authenticateToken, aiLimiter, aiController.reviewCV);

// ATS resume check (PDF file upload via memory multer)
router.post('/resume-check', authenticateToken, aiLimiter, memoryUpload.single('resume'), aiController.resumeCheck);

// Job status polling endpoint
router.get('/resume-check/:jobId', authenticateToken, aiController.getJobStatus);

module.exports = router;
