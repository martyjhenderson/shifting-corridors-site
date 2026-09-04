#!/bin/bash

# Static Site Deployment Script for Shifting Corridors Lodge
# This script deploys the static React SPA to AWS S3 + CloudFront

set -e

# Configuration
PROJECT_NAME="shifting-corridors-lodge"
REGION="us-east-1"  # Required for CloudFront SSL certificates

# Parse environment argument
ENVIRONMENT=${1:-prod}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "❌ Error: Environment must be 'dev', 'staging', or 'prod'"
    echo "Usage: $0 [dev|staging|prod]"
    exit 1
fi

echo "🚀 Deploying Shifting Corridors Lodge to $ENVIRONMENT environment..."

# Set environment-specific variables
case $ENVIRONMENT in
    "dev")
        STACK_NAME="$PROJECT_NAME-static-dev"
        PRIMARY_DOMAIN="shiftingcorridors.com"
        SECONDARY_DOMAIN=""
        PRIMARY_HOSTED_ZONE_ID="Z03318772B503VRJ8T1YH"
        SECONDARY_HOSTED_ZONE_ID=""
        ;;
    "staging")
        STACK_NAME="$PROJECT_NAME-static-staging"
        PRIMARY_DOMAIN="shiftingcorridors.com"
        SECONDARY_DOMAIN=""
        PRIMARY_HOSTED_ZONE_ID="Z03318772B503VRJ8T1YH"
        SECONDARY_HOSTED_ZONE_ID=""
        ;;
    "prod")
        STACK_NAME="$PROJECT_NAME-static-prod"
        PRIMARY_DOMAIN="shiftingcorridors.com"
        SECONDARY_DOMAIN="shiftingcorridor.com"
        PRIMARY_HOSTED_ZONE_ID="Z03318772B503VRJ8T1YH"
        SECONDARY_HOSTED_ZONE_ID="Z04363683RARVTPC87S05"
        ;;
esac

echo "📋 Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Stack Name: $STACK_NAME"
echo "   Primary Domain: $PRIMARY_DOMAIN"
echo "   Secondary Domain: ${SECONDARY_DOMAIN:-"(none)"}"
echo "   Primary Hosted Zone: $PRIMARY_HOSTED_ZONE_ID"
echo "   Region: $REGION"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
    exit 1
fi

# Validate hosted zones exist for production
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🔍 Validating hosted zones for production deployment..."
    
    # Check primary hosted zone
    if ! aws route53 get-hosted-zone --id "$PRIMARY_HOSTED_ZONE_ID" > /dev/null 2>&1; then
        echo "❌ Error: Primary hosted zone $PRIMARY_HOSTED_ZONE_ID not found"
        exit 1
    fi
    
    # Check secondary hosted zone
    if [ -n "$SECONDARY_HOSTED_ZONE_ID" ]; then
        if ! aws route53 get-hosted-zone --id "$SECONDARY_HOSTED_ZONE_ID" > /dev/null 2>&1; then
            echo "❌ Error: Secondary hosted zone $SECONDARY_HOSTED_ZONE_ID not found"
            exit 1
        fi
    fi
    
    echo "✅ Hosted zones validated successfully"
    echo "   Primary domain: $PRIMARY_DOMAIN (Zone: $PRIMARY_HOSTED_ZONE_ID)"
    if [ -n "$SECONDARY_DOMAIN" ]; then
        echo "   Secondary domain: $SECONDARY_DOMAIN (Zone: $SECONDARY_HOSTED_ZONE_ID)"
    fi
fi

# Build the React application
echo "🔨 Building React application..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Error: Build directory not found. Build may have failed."
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy CloudFormation stack
echo "☁️  Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file aws/cloudformation/static-infrastructure.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ProjectName="$PROJECT_NAME" \
        Environment="$ENVIRONMENT" \
        PrimaryDomainName="$PRIMARY_DOMAIN" \
        SecondaryDomainName="$SECONDARY_DOMAIN" \
        PrimaryHostedZoneId="$PRIMARY_HOSTED_ZONE_ID" \
        SecondaryHostedZoneId="$SECONDARY_HOSTED_ZONE_ID" \
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
WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

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
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Primary Website URL: $WEBSITE_URL"
if [ "$ENVIRONMENT" = "prod" ] && [ -n "$SECONDARY_DOMAIN" ]; then
    echo "   Secondary Website URL: https://$SECONDARY_DOMAIN"
fi
echo "   CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "   S3 Bucket: $WEBSITE_BUCKET"
echo ""
echo "🔗 Your site should be available at:"
echo "   Primary: $WEBSITE_URL"
if [ "$ENVIRONMENT" = "prod" ] && [ -n "$SECONDARY_DOMAIN" ]; then
    echo "   Secondary: https://$SECONDARY_DOMAIN"
    echo "   With www: https://www.$PRIMARY_DOMAIN"
    echo "   With www: https://www.$SECONDARY_DOMAIN"
fi
echo "   Note: SSL certificate validation and DNS propagation may take up to 30 minutes"
echo ""

# Optional: Wait for invalidation to complete
read -p "⏳ Wait for CloudFront invalidation to complete? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏳ Waiting for CloudFront invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_ID"
    echo "✅ CloudFront invalidation completed"
fi

echo "🚀 Deployment script finished!"