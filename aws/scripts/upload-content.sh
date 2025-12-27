#!/bin/bash

# Content Upload Script
set -e

PROJECT_NAME="shifting-corridors-lodge"
ENVIRONMENT=${1:-prod}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "📁 Uploading content to AWS S3..."

# Get content bucket name
CONTENT_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ContentBucketName`].OutputValue' \
    --output text \
    --region $AWS_REGION)

if [ -z "$CONTENT_BUCKET" ]; then
    echo "❌ Could not find content bucket. Make sure the stack is deployed."
    exit 1
fi

echo "📦 Uploading to bucket: $CONTENT_BUCKET"

# Upload content
aws s3 sync src/content/ s3://$CONTENT_BUCKET/src/content/ \
    --delete \
    --region $AWS_REGION

echo "✅ Content uploaded successfully!"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."

DISTRIBUTION_ID=$(aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --logical-resource-id CloudFrontDistribution \
    --query 'StackResources[0].PhysicalResourceId' \
    --output text \
    --region $AWS_REGION)

if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --region $AWS_REGION > /dev/null
    echo "✅ CloudFront cache invalidated"
    echo "⏳ Changes will be visible in 1-3 minutes"
else
    echo "⚠️  CloudFront distribution ID not found, skipping cache invalidation"
fi

echo ""
echo "📋 Uploaded directories:"
echo "   📅 Calendar events: s3://$CONTENT_BUCKET/src/content/calendar/"
echo "   📰 News articles: s3://$CONTENT_BUCKET/src/content/news/"
echo "   🎮 Game masters: s3://$CONTENT_BUCKET/src/content/gamemasters/"