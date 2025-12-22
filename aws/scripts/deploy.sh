#!/bin/bash

# AWS Deployment Script for Shifting Corridors Lodge
set -e

# Configuration
PROJECT_NAME="shifting-corridors-lodge"
ENVIRONMENT=${1:-prod}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"
PRIMARY_DOMAIN="shiftingcorridors.com"
SECONDARY_DOMAIN="shiftingcorridor.com"

echo "🚀 Deploying ${PROJECT_NAME} to ${ENVIRONMENT} environment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Not authenticated with AWS. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Function to get hosted zone ID
get_hosted_zone_id() {
    local domain=$1
    local zone_id=$(aws route53 list-hosted-zones-by-name \
        --dns-name $domain \
        --query 'HostedZones[0].Id' \
        --output text \
        --region $AWS_REGION | sed 's|/hostedzone/||')
    
    if [ "$zone_id" = "None" ] || [ -z "$zone_id" ]; then
        echo ""
    else
        echo "$zone_id"
    fi
}

# Get hosted zone IDs
echo "🔍 Looking up hosted zones..."
PRIMARY_HOSTED_ZONE_ID=$(get_hosted_zone_id $PRIMARY_DOMAIN)
SECONDARY_HOSTED_ZONE_ID=""

if [ "$ENVIRONMENT" = "prod" ]; then
    SECONDARY_HOSTED_ZONE_ID=$(get_hosted_zone_id $SECONDARY_DOMAIN)
fi

if [ -z "$PRIMARY_HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone for ${PRIMARY_DOMAIN} not found. Please create it first."
    exit 1
fi

echo "✅ Found primary hosted zone: $PRIMARY_HOSTED_ZONE_ID"

if [ "$ENVIRONMENT" = "prod" ] && [ -z "$SECONDARY_HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone for ${SECONDARY_DOMAIN} not found. Please create it first."
    exit 1
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo "✅ Found secondary hosted zone: $SECONDARY_HOSTED_ZONE_ID"
fi

# Prepare CloudFormation parameters
PARAMETERS="ProjectName=$PROJECT_NAME Environment=$ENVIRONMENT PrimaryDomainName=$PRIMARY_DOMAIN PrimaryHostedZoneId=$PRIMARY_HOSTED_ZONE_ID"

if [ "$ENVIRONMENT" = "prod" ] && [ ! -z "$SECONDARY_HOSTED_ZONE_ID" ]; then
    PARAMETERS="$PARAMETERS SecondaryDomainName=$SECONDARY_DOMAIN SecondaryHostedZoneId=$SECONDARY_HOSTED_ZONE_ID"
fi

# Deploy CloudFormation stack
echo "📦 Deploying infrastructure..."
aws cloudformation deploy \
    --template-file aws/cloudformation/infrastructure.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides $PARAMETERS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $AWS_REGION

echo "✅ Infrastructure deployed"

# Get stack outputs
CONTENT_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ContentBucketName`].OutputValue' \
    --output text \
    --region $AWS_REGION)

WEBSITE_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text \
    --region $AWS_REGION)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

PRIMARY_DOMAIN_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PrimaryDomainUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

SECONDARY_DOMAIN_URL=""
if [ "$ENVIRONMENT" = "prod" ]; then
    SECONDARY_DOMAIN_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`SecondaryDomainUrl`].OutputValue' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
fi

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

echo "📝 Stack Outputs:"
echo "   Content Bucket: $CONTENT_BUCKET"
echo "   Website Bucket: $WEBSITE_BUCKET"
echo "   API URL: $API_URL"
echo "   Primary Domain: $PRIMARY_DOMAIN_URL"
if [ ! -z "$SECONDARY_DOMAIN_URL" ] && [ "$SECONDARY_DOMAIN_URL" != "None" ]; then
    echo "   Secondary Domain: $SECONDARY_DOMAIN_URL"
fi
echo "   CloudFront URL: $CLOUDFRONT_URL"

# Upload content to S3
echo "📁 Uploading content to S3..."
aws s3 sync src/content/ s3://$CONTENT_BUCKET/src/content/ \
    --delete \
    --region $AWS_REGION

echo "✅ Content uploaded"

# Build React app with correct API URL
echo "🔨 Building React app..."
export REACT_APP_API_BASE_URL=$API_URL
export REACT_APP_USE_FALLBACK=false
npm run build

echo "✅ React app built"

# Upload website to S3
echo "🌐 Uploading website to S3..."
aws s3 sync build/ s3://$WEBSITE_BUCKET/ \
    --delete \
    --region $AWS_REGION

echo "✅ Website uploaded"

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='${STACK_NAME}'].Id" \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    # Try to get it from the CloudFormation stack
    DISTRIBUTION_ID=$(aws cloudformation describe-stack-resources \
        --stack-name $STACK_NAME \
        --logical-resource-id CloudFrontDistribution \
        --query 'StackResources[0].PhysicalResourceId' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
fi

# Invalidate CloudFront cache
if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --region $AWS_REGION
    echo "✅ CloudFront cache invalidated"
else
    echo "⚠️  CloudFront distribution ID not found, skipping cache invalidation"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Access your site:"
echo "   Primary Domain: $PRIMARY_DOMAIN_URL"
if [ ! -z "$SECONDARY_DOMAIN_URL" ] && [ "$SECONDARY_DOMAIN_URL" != "None" ]; then
    echo "   Secondary Domain: $SECONDARY_DOMAIN_URL"
fi
echo "   CloudFront URL: $CLOUDFRONT_URL"
echo "   API URL: $API_URL"
echo ""
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🌍 Production domains:"
    echo "   • https://$PRIMARY_DOMAIN"
    echo "   • https://www.$PRIMARY_DOMAIN"
    echo "   • https://$SECONDARY_DOMAIN"
    echo "   • https://www.$SECONDARY_DOMAIN"
else
    echo "🧪 Development domain:"
    echo "   • https://${ENVIRONMENT}.${PRIMARY_DOMAIN}"
    echo "   • https://www.${ENVIRONMENT}.${PRIMARY_DOMAIN}"
fi
echo ""
echo "⏳ Note: SSL certificate validation and DNS propagation may take 5-30 minutes"
echo ""
echo "🔧 Environment variables for local development:"
echo "   REACT_APP_API_BASE_URL=$API_URL"
echo "   REACT_APP_USE_FALLBACK=false"