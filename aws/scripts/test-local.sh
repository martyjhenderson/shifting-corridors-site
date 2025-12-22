#!/bin/bash

# Local Testing Script for AWS Lambda Functions
set -e

echo "🧪 Testing Lambda functions locally..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Test list-files function
echo "📁 Testing list-files function..."
cd aws/lambda

# Create test event for list-files
cat > test-list-files.json << EOF
{
  "httpMethod": "GET",
  "queryStringParameters": {
    "directory": "src/content/calendar"
  }
}
EOF

# Set environment variable
export CONTENT_BUCKET_NAME="test-bucket"

echo "   Input: directory=src/content/calendar"
echo "   Expected: Array of .md filenames"
echo ""

# Test get-file function
echo "📄 Testing get-file function..."

# Create test event for get-file
cat > test-get-file.json << EOF
{
  "httpMethod": "GET",
  "queryStringParameters": {
    "path": "src/content/calendar/diversions-game-night.md"
  }
}
EOF

echo "   Input: path=src/content/calendar/diversions-game-night.md"
echo "   Expected: Markdown file content"
echo ""

echo "✅ Test files created in aws/lambda/"
echo "📋 To test manually:"
echo "   cd aws/lambda"
echo "   export CONTENT_BUCKET_NAME=your-actual-bucket-name"
echo "   node -e \"const handler = require('./list-files.js').handler; handler(require('./test-list-files.json')).then(console.log)\""

# Cleanup
rm -f test-list-files.json test-get-file.json
cd ../..

echo "🎉 Local testing setup complete!"