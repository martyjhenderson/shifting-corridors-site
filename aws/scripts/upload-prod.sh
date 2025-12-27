#!/bin/bash

# Simple Production Upload Script for Shifting Corridors Lodge
# This script builds and uploads to the existing S3 bucket without CloudFormation deployment

set -e

# Configuration
PROJECT_NAME="shifting-corridors-lodge"
ENVIRONMENT="prod"
STACK_NAME="$PROJECT_NAME-static-prod"
REGION="us-east-1"

echo "🚀 Building and uploading to production environment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
    exit 1
fi

# Get stack outputs to find bucket and distribution
echo "📤 Getting stack outputs..."
WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -z "$WEBSITE_BUCKET" ] || [ "$WEBSITE_BUCKET" = "None" ]; then
    echo "❌ Error: Could not find S3 bucket from CloudFormation stack $STACK_NAME"
    echo "Make sure the stack exists and has been deployed"
    exit 1
fi

# Verify the bucket exists
if ! aws s3 ls "s3://$WEBSITE_BUCKET" > /dev/null 2>&1; then
    echo "❌ Error: S3 bucket $WEBSITE_BUCKET does not exist or is not accessible"
    echo "Please check your AWS permissions and bucket configuration"
    exit 1
fi

echo "📋 Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Website Bucket: $WEBSITE_BUCKET"
echo "   CloudFront Distribution: ${CLOUDFRONT_DISTRIBUTION_ID:-"(not found)"}"

# Build the React application
echo "🔨 Building React application..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Error: Build directory not found. Build may have failed."
    exit 1
fi

echo "✅ Build completed successfully"

# Upload website files to S3
echo "📁 Uploading website files to S3..."
aws s3 sync build/ s3://"$WEBSITE_BUCKET"/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js" \
    --exclude "manifest.json"

# Upload HTML files with shorter cache
aws s3 sync build/ s3://"$WEBSITE_BUCKET"/ \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --include "service-worker.js" \
    --include "manifest.json"

echo "✅ Website files uploaded successfully"

# Invalidate CloudFront cache if distribution exists
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ] && [ "$CLOUDFRONT_DISTRIBUTION_ID" != "None" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    echo "   Invalidation ID: $INVALIDATION_ID"
    echo "✅ CloudFront cache invalidation started"
else
    echo "⚠️  No CloudFront distribution found - files uploaded to S3 only"
fi

# Final success message
echo ""
echo "🎉 Production upload completed successfully!"
echo ""
echo "📋 Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   S3 Bucket: $WEBSITE_BUCKET"
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ] && [ "$CLOUDFRONT_DISTRIBUTION_ID" != "None" ]; then
    echo "   CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
fi
echo ""
echo "🔗 Your production site should be updated at:"
echo "   https://shiftingcorridors.com"
echo "   https://shiftingcorridor.com"
echo "   https://www.shiftingcorridors.com"
echo "   https://www.shiftingcorridor.com"
echo ""

echo "🚀 Production upload script finished!"