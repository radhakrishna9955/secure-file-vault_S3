const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const { GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/aws');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = req.user.role === 'admin' ? 'admin-uploads' : 'pending';
      const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/', 'application/pdf', 'text/', 'application/zip'];
    const isAllowed = allowed.some(type => file.mimetype.startsWith(type));
    cb(null, isAllowed);
  },
});

// Upload file
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  
  res.json({
    message: req.user.role === 'admin'
      ? 'File uploaded to admin vault.'
      : 'File submitted for review.',
    key: req.file.key,
    location: req.file.location,
  });
});

// List admin files (visible to all authenticated users)
router.get('/public', verifyToken, async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: 'admin-uploads/',
    });
    
    const response = await s3Client.send(command);
    const files = (response.Contents || []).map(file => ({
      key: file.Key,
      name: file.Key.replace('admin-uploads/', ''),
      size: file.Size,
      lastModified: file.LastModified,
    }));
    
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List pending files (admin only)
router.get('/pending', verifyAdmin, async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: 'pending/',
    });
    
    const response = await s3Client.send(command);
    const files = (response.Contents || []).map(file => ({
      key: file.Key,
      name: file.Key.replace('pending/', ''),
      size: file.Size,
      lastModified: file.LastModified,
    }));
    
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file (admin only)
router.delete('/:key(*)', verifyAdmin, async (req, res) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: req.params.key,
    });
    
    await s3Client.send(command);
    res.json({ message: 'File deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;