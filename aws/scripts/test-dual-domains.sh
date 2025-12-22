#!/bin/bash

# Test script to verify dual domain configuration
set -e

PRIMARY_DOMAIN="shiftingcorridors.com"
SECONDARY_DOMAIN="shiftingcorridor.com"
AWS_REGION="us-east-1"

echo "🔍 Testing dual domain configuration..."

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

# Test primary domain
echo "Testing primary domain: $PRIMARY_DOMAIN"
PRIMARY_HOSTED_ZONE_ID=$(get_hosted_zone_id $PRIMARY_DOMAIN)

if [ -z "$PRIMARY_HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone for ${PRIMARY_DOMAIN} not found"
    exit 1
else
    echo "✅ Primary hosted zone found: $PRIMARY_HOSTED_ZONE_ID"
fi

# Test secondary domain
echo "Testing secondary domain: $SECONDARY_DOMAIN"
SECONDARY_HOSTED_ZONE_ID=$(get_hosted_zone_id $SECONDARY_DOMAIN)

if [ -z "$SECONDARY_HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone for ${SECONDARY_DOMAIN} not found"
    exit 1
else
    echo "✅ Secondary hosted zone found: $SECONDARY_HOSTED_ZONE_ID"
fi

echo ""
echo "🎉 Dual domain configuration is ready!"
echo "Primary Domain: $PRIMARY_DOMAIN (Zone: $PRIMARY_HOSTED_ZONE_ID)"
echo "Secondary Domain: $SECONDARY_DOMAIN (Zone: $SECONDARY_HOSTED_ZONE_ID)"
echo ""
echo "CloudFormation parameters will be:"
echo "  PrimaryDomainName=$PRIMARY_DOMAIN"
echo "  PrimaryHostedZoneId=$PRIMARY_HOSTED_ZONE_ID"
echo "  SecondaryDomainName=$SECONDARY_DOMAIN"
echo "  SecondaryHostedZoneId=$SECONDARY_HOSTED_ZONE_ID"
echo ""
echo "SSL Certificate will cover:"
echo "  - https://$PRIMARY_DOMAIN"
echo "  - https://www.$PRIMARY_DOMAIN"
echo "  - https://$SECONDARY_DOMAIN"
echo "  - https://www.$SECONDARY_DOMAIN"