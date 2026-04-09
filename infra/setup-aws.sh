#!/bin/bash
# Run this once to configure AWS resources

BUCKET_NAME="radha-s3-project-bucket"
REGION="us-east-1"

# Create S3 bucket
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION \

# Block all public access
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms"
      }
    }]
  }'

# Create S3 folders (prefixes)
aws s3api put-object --bucket $BUCKET_NAME --key admin-uploads/
aws s3api put-object --bucket $BUCKET_NAME --key pending/
aws s3api put-object --bucket $BUCKET_NAME --key approved/

# Verify SES email (replace with your email)
aws ses verify-email-identity --email-address radhakrishnagandepalli@gmail.com --region $REGION

echo "AWS setup complete!"
echo "IMPORTANT: Verify your SES email by clicking the link sent to it."
echo "Set S3_BUCKET_NAME=$BUCKET_NAME in your .env file"