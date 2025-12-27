#!/bin/bash

# Simple Development Deployment Script for Shifting Corridors Lodge
# This script just uploads to the existing S3 bucket and CloudFront distribution

set -e

# Configuration
PROJECT_NAME="shifting-corridors-lodge"
WEBSITE_BUCKET="shifting-corridors-lodge-website-dev"

echo "🚀 Deploying Shifting Corridors Lodge to development environment..."

echo "📋 Configuration:"
echo "   Website Bucket: $WEBSITE_BUCKET"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
    exit 1
fi

# Check if bucket exists
if ! aws s3 ls "s3://$WEBSITE_BUCKET" > /dev/null 2>&1; then
    echo "❌ Error: S3 bucket $WEBSITE_BUCKET does not exist"
    exit 1
fi

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

# Try to find and invalidate CloudFront distribution
echo "🔍 Looking for CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$WEBSITE_BUCKET.s3-website-us-east-1.amazonaws.com'].Id" --output text 2>/dev/null || echo "")

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "🔄 Invalidating CloudFront cache for distribution: $DISTRIBUTION_ID"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
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
echo "🎉 Development deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "   S3 Bucket: $WEBSITE_BUCKET"
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "   CloudFront Distribution: $DISTRIBUTION_ID"
fi
echo ""
echo "🔗 Your development site should be available at:"
echo "   S3 Website: http://$WEBSITE_BUCKET.s3-website-us-east-1.amazonaws.com"
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text 2>/dev/null || echo "")
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        echo "   CloudFront: https://$CLOUDFRONT_DOMAIN"
    fi
fi
echo ""

echo "🚀 Development deployment script finished!"