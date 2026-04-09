const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

// In-memory store — replace with DB in production
const fileRequests = [];

// User requests access to a file
router.post('/', verifyToken, (req, res) => {
  const { fileKey, fileName } = req.body;
  
  if (!fileKey) return res.status(400).json({ error: 'File key required.' });
  
  const existing = fileRequests.find(
    r => r.fileKey === fileKey && r.userId === req.user.id && r.status === 'pending'
  );
  if (existing) return res.status(409).json({ error: 'Request already pending.' });
  
  const request = {
    id: uuidv4(),
    fileKey,
    fileName,
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  fileRequests.push(request);
  res.status(201).json({ message: 'Access request submitted.', request });
});

// Get user's own requests
router.get('/my', verifyToken, (req, res) => {
  const myRequests = fileRequests.filter(r => r.userId === req.user.id);
  res.json({ requests: myRequests });
});

// Get all pending requests (admin only)
router.get('/all', verifyAdmin, (req, res) => {
  res.json({ requests: fileRequests });
});

// Export for use in admin routes
router.fileRequests = fileRequests;
module.exports = router;