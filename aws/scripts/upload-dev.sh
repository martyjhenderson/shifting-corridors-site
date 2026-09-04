#!/bin/bash

# Simple Development Upload Script for Shifting Corridors Lodge
# This script builds and uploads to the existing S3 bucket without CloudFormation deployment

set -e

# Configuration
PROJECT_NAME="shifting-corridors-lodge"
ENVIRONMENT="dev"
STACK_NAME="$PROJECT_NAME-dev"
REGION="us-east-1"
FALLBACK_BUCKET="shifting-corridors-lodge-website-dev"
FALLBACK_DOMAIN="dev.shiftingcorridors.com"

echo "🚀 Building and uploading to development environment..."

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

# If no bucket found in stack outputs, use fallback bucket name
if [ -z "$WEBSITE_BUCKET" ] || [ "$WEBSITE_BUCKET" = "None" ]; then
    echo "⚠️  No WebsiteBucketName output found in stack, using fallback bucket name"
    WEBSITE_BUCKET="$FALLBACK_BUCKET"
fi

# Same fallback for the distribution: the dev stack exports no
# CloudFrontDistributionId, so look it up by the domain it serves. Needs
# cloudfront:ListDistributions; without that permission this stays empty and
# the invalidation is skipped with a warning, exactly as before.
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ] || [ "$CLOUDFRONT_DISTRIBUTION_ID" = "None" ]; then
    echo "⚠️  No CloudFrontDistributionId output in stack, looking it up by domain..."
    CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Aliases.Items, '$FALLBACK_DOMAIN')].Id | [0]" \
        --output text 2>/dev/null || echo "")
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

# Upload website files to S3.
#
# Only build/assets/ is content-hashed — Vite gives those files a new name
# whenever they change, so they can be cached forever. Everything else keeps a
# stable name and changes in place (index.html, feed.xml, admin-config.yml), so
# it has to revalidate.
#
# Two syncs over disjoint prefixes, each owning --delete for its own scope.
# Excluded keys are invisible to sync, so the first pass leaves assets/ alone
# entirely and the second prunes stale hashed files.
#
# The previous version gave every non-HTML file a year-long cache and relied on
# a CloudFront invalidation afterwards to make changes visible. That papered
# over it on production, but dev resolves no distribution ID and so never
# invalidates — leaving mutable files stuck at their first-cached version.
echo "📁 Uploading website files to S3..."
aws s3 sync build/ s3://"$WEBSITE_BUCKET"/ \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --exclude "assets/*"

# Hashed assets: safe to cache indefinitely, since a change means a new name.
echo "📁 Uploading hashed assets..."
aws s3 sync build/assets/ s3://"$WEBSITE_BUCKET"/assets/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable"

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
echo "🎉 Development upload completed successfully!"
echo ""
echo "📋 Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   S3 Bucket: $WEBSITE_BUCKET"
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ] && [ "$CLOUDFRONT_DISTRIBUTION_ID" != "None" ]; then
    echo "   CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
fi
echo ""
echo "🔗 Your development site should be updated at:"
echo "   https://dev.shiftingcorridors.com"
echo ""

echo "🚀 Development upload script finished!"