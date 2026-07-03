const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');

const RECRUITER_ROLES = new Set(['company', 'college', 'admin', 'faculty']);

router.get('/resumes/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const requester = await User.findOne({ email: req.user.email });
    if (!requester) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const resumeOwner = await User.findOne({ resumeUrl: `/api/files/resumes/${filename}` });
    if (!resumeOwner) {
      return res.status(404).json({ error: 'File not found' });
    }

    const isOwner = requester.email === resumeOwner.email;
    const isRecruiter = RECRUITER_ROLES.has(requester.userRole);
    const isPublicProfile = !resumeOwner.isProfilePrivate;

    if (!isOwner && !isRecruiter && !isPublicProfile) {
      return res.status(403).json({ error: 'You do not have permission to access this resume.' });
    }

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
    const file = await mongoose.connection.db.collection('resumes.files').findOne({ filename });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.set('Content-Type', file.contentType);
    const downloadStream = bucket.openDownloadStreamByName(filename);
    downloadStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

module.exports = router;
