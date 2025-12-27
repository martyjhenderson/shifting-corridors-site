#!/bin/bash

# Test script to verify both production domains are working
# This script tests all 4 domain variants for the production site

set -e

echo "🔍 Testing Shifting Corridors Lodge production domains..."

DOMAINS=(
    "https://shiftingcorridors.com"
    "https://www.shiftingcorridors.com"
    "https://shiftingcorridor.com"
    "https://www.shiftingcorridor.com"
)

SUCCESS_COUNT=0
TOTAL_COUNT=${#DOMAINS[@]}

for domain in "${DOMAINS[@]}"; do
    echo -n "Testing $domain... "
    
    # Test HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$domain" --max-time 10 || echo "000")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ OK ($status_code)"
        ((SUCCESS_COUNT++))
    else
        echo "❌ FAILED ($status_code)"
    fi
done

echo ""
echo "📊 Test Results:"
echo "   Successful: $SUCCESS_COUNT/$TOTAL_COUNT domains"

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    echo "🎉 All production domains are working correctly!"
    exit 0
else
    echo "⚠️  Some domains are not responding correctly"
    echo "   This may be due to DNS propagation or SSL certificate validation"
    echo "   Wait a few minutes and try again"
    exit 1
fi