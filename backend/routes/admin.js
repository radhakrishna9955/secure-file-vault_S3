const express = require('express');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { s3Client, sesClient } = require('../config/aws');
const { verifyAdmin } = require('../middleware/auth');
const requestsRouter = require('./requests');
const router = express.Router();

// Approve request — generate presigned URL and email it
router.post('/approve/:requestId', verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = requestsRouter.fileRequests.find(r => r.id === requestId);
    
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'Already processed.' });
    
    // Generate presigned URL (15 minutes TTL)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: request.fileKey,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    // Send approval email via SES
    const emailCommand = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [request.userEmail] },
      Message: {
        Subject: { Data: `Your file access request has been approved` },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">Access Approved!</h2>
                <p>Hi ${request.userName},</p>
                <p>Your request to access <strong>${request.fileName}</strong> has been approved.</p>
                <p>Click the button below to download. This link expires in <strong>15 minutes</strong>.</p>
                <a href="${signedUrl}" 
                   style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;
                          text-decoration:none;border-radius:8px;margin:16px 0;">
                  Download File
                </a>
                <p style="color:#666;font-size:12px;">
                  If the button doesn't work, copy this URL:<br/>
                  <span style="word-break:break-all;">${signedUrl}</span>
                </p>
              </div>
            `,
          },
        },
      },
    });
    
    await sesClient.send(emailCommand);
    
    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    
    res.json({ message: `Approval email sent to ${request.userEmail}`, signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deny request
router.post('/deny/:requestId', verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = requestsRouter.fileRequests.find(r => r.id === requestId);
    
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    
    request.status = 'denied';
    request.deniedAt = new Date().toISOString();
    
    // Optionally send denial email
    const emailCommand = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [request.userEmail] },
      Message: {
        Subject: { Data: `Update on your file access request` },
        Body: {
          Html: {
            Data: `<p>Hi ${request.userName}, your request for <strong>${request.fileName}</strong> was not approved at this time. Please contact your administrator.</p>`,
          },
        },
      },
    });
    
    await sesClient.send(emailCommand);
    
    res.json({ message: 'Request denied.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats
router.get('/stats', verifyAdmin, (req, res) => {
  const requests = requestsRouter.fileRequests;
  res.json({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  });
});

module.exports = router;