#!/bin/bash

# Development Deployment Script for Shifting Corridors Lodge
# This script deploys the static React SPA to AWS S3 + CloudFront for development

set -e

# Configuration
PROJECT_NAME="shifting-corridors-lodge"
REGION="us-east-1"  # Required for CloudFront SSL certificates
STACK_NAME="$PROJECT_NAME-dev"
DOMAIN_NAME="dev.shiftingcorridors.com"
HOSTED_ZONE_ID="Z03318772B503VRJ8T1YH"
WEBSITE_BUCKET="shifting-corridors-lodge-website-dev"

echo "🚀 Deploying Shifting Corridors Lodge to development environment..."

echo "📋 Configuration:"
echo "   Stack Name: $STACK_NAME"
echo "   Domain: $DOMAIN_NAME"
echo "   Hosted Zone: $HOSTED_ZONE_ID"
echo "   Website Bucket: $WEBSITE_BUCKET"
echo "   Region: $REGION"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
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

# Deploy CloudFormation stack (CloudFront + SSL + DNS only, uses existing S3 bucket)
echo "☁️  Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file aws/cloudformation/dev-infrastructure.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ProjectName="$PROJECT_NAME" \
        DomainName="$DOMAIN_NAME" \
        HostedZoneId="$HOSTED_ZONE_ID" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo "✅ CloudFormation stack deployed successfully"
else
    echo "❌ Error: CloudFormation deployment failed"
    exit 1
fi

# Get stack outputs
echo "📤 Getting stack outputs..."
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

echo "   Website Bucket: $WEBSITE_BUCKET"
echo "   CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "   Website URL: $WEBSITE_URL"

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

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "   Invalidation ID: $INVALIDATION_ID"
echo "✅ CloudFront cache invalidation started"

# Final success message
echo ""
echo "🎉 Development deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "   Website URL: $WEBSITE_URL"
echo "   CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "   S3 Bucket: $WEBSITE_BUCKET"
echo ""
echo "🔗 Your development site should be available at: $WEBSITE_URL"
echo "   Note: SSL certificate validation may take up to 30 minutes for first deployment"
echo ""

echo "🚀 Development deployment script finished!"