const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const { supabase } = require('../utils/supabase');

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

    if (supabase) {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filename);

      if (error || !data) {
        return res.status(404).json({ error: 'File not found on storage server.' });
      }

      const arrayBuffer = await data.arrayBuffer();
      res.set('Content-Type', 'application/pdf');
      res.send(Buffer.from(arrayBuffer));
    } else {
      console.warn("⚠️ Warning: Supabase storage is not configured. Bypassing download.");
      res.status(404).json({ error: 'Supabase storage is not configured.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

module.exports = router;
