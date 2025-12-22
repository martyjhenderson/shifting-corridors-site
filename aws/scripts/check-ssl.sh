#!/bin/bash

# Check SSL certificate status for dual domains
set -e

ENVIRONMENT=${1:-prod}
STACK_NAME="shifting-corridors-lodge-${ENVIRONMENT}"
AWS_REGION="us-east-1"

echo "🔍 Checking SSL certificate status for ${ENVIRONMENT} environment..."

# Get SSL certificate ARN from CloudFormation stack
CERT_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`SSLCertificateArn`].OutputValue' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
    echo "❌ SSL certificate ARN not found in stack outputs"
    exit 1
fi

echo "✅ SSL Certificate ARN: $CERT_ARN"

# Get certificate details
echo ""
echo "📋 Certificate Details:"
aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region $AWS_REGION \
    --query '{
        Status: Certificate.Status,
        DomainName: Certificate.DomainName,
        SubjectAlternativeNames: Certificate.SubjectAlternativeNames,
        ValidationMethod: Certificate.ValidationMethod,
        ValidationRecords: Certificate.DomainValidationOptions[].ValidationStatus
    }' \
    --output table

# Check certificate status
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region $AWS_REGION \
    --query 'Certificate.Status' \
    --output text)

echo ""
if [ "$CERT_STATUS" = "ISSUED" ]; then
    echo "✅ SSL certificate is ISSUED and ready"
elif [ "$CERT_STATUS" = "PENDING_VALIDATION" ]; then
    echo "⏳ SSL certificate is PENDING_VALIDATION"
    echo "   This can take 5-30 minutes. DNS validation records should be automatically created."
else
    echo "⚠️  SSL certificate status: $CERT_STATUS"
fi

# Get CloudFront distribution details
echo ""
echo "🌐 CloudFront Distribution:"
DISTRIBUTION_ID=$(aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --logical-resource-id CloudFrontDistribution \
    --query 'StackResources[0].PhysicalResourceId' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "Distribution ID: $DISTRIBUTION_ID"
    
    # Get distribution aliases
    aws cloudfront get-distribution \
        --id $DISTRIBUTION_ID \
        --query '{
            Status: Distribution.Status,
            Aliases: Distribution.DistributionConfig.Aliases.Items,
            CertificateArn: Distribution.DistributionConfig.ViewerCertificate.ACMCertificateArn
        }' \
        --output table
else
    echo "❌ CloudFront distribution not found"
fi

echo ""
echo "🔗 Test your domains:"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "   https://shiftingcorridors.com"
    echo "   https://www.shiftingcorridors.com"
    echo "   https://shiftingcorridor.com"
    echo "   https://www.shiftingcorridor.com"
else
    echo "   https://${ENVIRONMENT}.shiftingcorridors.com"
    echo "   https://www.${ENVIRONMENT}.shiftingcorridors.com"
fi