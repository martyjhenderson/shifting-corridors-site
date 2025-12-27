#!/bin/bash

# CloudFront Cache Invalidation Script
set -e

PROJECT_NAME="shifting-corridors-lodge"
ENVIRONMENT=${1:-prod}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "🔄 Invalidating CloudFront cache for ${ENVIRONMENT}..."

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --logical-resource-id CloudFrontDistribution \
    --query 'StackResources[0].PhysicalResourceId' \
    --output text \
    --region $AWS_REGION)

if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "📡 Distribution ID: $DISTRIBUTION_ID"
    
    # Create invalidation
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text \
        --region $AWS_REGION)
    
    echo "✅ CloudFront cache invalidation created: $INVALIDATION_ID"
    echo "⏳ Cache invalidation typically takes 1-3 minutes to complete"
    echo "🌐 Your changes should be visible shortly at your domain"
else
    echo "❌ CloudFront distribution ID not found"
    echo "   Make sure the stack is deployed: $STACK_NAME"
    exit 1
fi