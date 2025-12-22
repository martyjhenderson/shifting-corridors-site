# AWS Serverless Deployment Guide

This guide explains how to deploy your Shifting Corridors Lodge site using AWS native services.

## 🏗️ Architecture

- **Frontend**: React app on S3 + CloudFront CDN
- **Content Storage**: S3 bucket for markdown files
- **API**: Lambda functions + API Gateway
- **Infrastructure**: CloudFormation for IaC
- **Domains**: Dual domain support in production (shiftingcorridors.com + shiftingcorridor.com)

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI installed and configured:**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS credentials
   aws configure
   ```

2. **Required AWS permissions:**
   - CloudFormation (full access)
   - S3 (full access)
   - Lambda (full access)
   - API Gateway (full access)
   - IAM (create roles and policies)
   - CloudFront (full access)
   - Route 53 (hosted zone access)

3. **Verify domain configuration:**
   ```bash
   # Test that both hosted zones exist and are accessible
   npm run aws:test-domains
   ```

### Deploy to Production

```bash
# Deploy everything (infrastructure + content + website)
# Automatically configures both shiftingcorridors.com and shiftingcorridor.com
npm run aws:deploy:prod
```

**Production Domains:**
- Primary: `https://shiftingcorridors.com` and `https://www.shiftingcorridors.com`
- Secondary: `https://shiftingcorridor.com` and `https://www.shiftingcorridor.com`
- Both domains serve the same content with shared SSL certificate

### Deploy to Development/Staging

```bash
# Development environment (uses dev.shiftingcorridors.com)
npm run aws:deploy:dev

# Staging environment (uses staging.shiftingcorridors.com)
npm run aws:deploy:staging
```

## 📋 Available Scripts

### Deployment Scripts
```bash
# Deploy to production (dual domains)
npm run aws:deploy:prod

# Deploy to development
npm run aws:deploy:dev

# Deploy to staging
npm run aws:deploy:staging
```

### Testing and Verification Scripts
```bash
# Test domain configuration before deployment
npm run aws:test-domains

# Check SSL certificate status
npm run aws:check-ssl:prod
npm run aws:check-ssl:dev

# Upload content only (after infrastructure is deployed)
npm run aws:upload-content:prod
npm run aws:upload-content:dev
```

## 📋 Step-by-Step Deployment

### 1. Deploy Infrastructure

The CloudFormation template creates:
- S3 buckets (content + website)
- Lambda functions (list-files, get-file)
- API Gateway with CORS
- CloudFront distribution with dual domain support
- SSL certificates for all domains (primary + secondary + www variants)
- Route 53 DNS records for both domains
- IAM roles and policies

**Dual Domain Configuration:**
- Production automatically configures both `shiftingcorridors.com` and `shiftingcorridor.com`
- Single SSL certificate covers all domain variants (www. subdomains included)
- Both hosted zones must exist in the same AWS account
- DNS records are automatically created for both domains

```bash
aws cloudformation deploy \
    --template-file aws/cloudformation/infrastructure.yaml \
    --stack-name shifting-corridors-lodge-prod \
    --parameter-overrides ProjectName=shifting-corridors-lodge Environment=prod \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1
```

### 2. Upload Content

```bash
# Upload markdown files to S3
npm run aws:upload-content:prod
```

### 3. Build and Deploy Website

```bash
# Build with correct API URL
export REACT_APP_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
export REACT_APP_USE_FALLBACK=false
npm run build

# Upload to S3
aws s3 sync build/ s3://your-website-bucket/ --delete
```

## 🔧 Configuration

### Domain Configuration

**Production (dual domains):**
- Primary: `shiftingcorridors.com` (with www variant)
- Secondary: `shiftingcorridor.com` (with www variant)
- SSL certificate covers all 4 domain variants
- Both hosted zones must exist in Route 53

**Development/Staging:**
- Uses subdomains: `dev.shiftingcorridors.com`, `staging.shiftingcorridors.com`
- Single domain with www variant
- Separate SSL certificate for each environment

### Environment Variables

The deployment script automatically sets these:

```bash
# Production
REACT_APP_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_USE_FALLBACK=false

# Development
REACT_APP_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
REACT_APP_USE_FALLBACK=false
```

### AWS Resources Created

| Resource | Purpose | Cost Impact |
|----------|---------|-------------|
| S3 Buckets (2) | Content + Website hosting | ~$0.02/GB/month |
| Lambda Functions (2) | API endpoints | ~$0.20/1M requests |
| API Gateway | REST API | ~$3.50/1M requests |
| CloudFront | CDN | ~$0.085/GB transfer |

**Estimated monthly cost for small site: $5-15**

## 📁 Content Management

### Adding New Content

1. **Add markdown files locally:**
   ```bash
   # Add new event
   echo "---
   title: New Event
   date: 2026-01-15
   ---
   # New Event Content" > src/content/calendar/new-event.md
   ```

2. **Upload to S3:**
   ```bash
   npm run aws:upload-content:prod
   ```

3. **Content is immediately available** (no rebuild needed!)

### Content Structure in S3

```
s3://your-content-bucket/
├── src/content/
│   ├── calendar/
│   │   ├── diversions-game-night.md
│   │   └── tempest-event.md
│   ├── news/
│   │   └── latest-news.md
│   └── gamemasters/
│       └── marty-h.md
```

## 🔍 Testing

### Test API Endpoints

```bash
# List calendar files
curl "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/api/files?directory=src/content/calendar"

# Get specific file
curl "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/api/file?path=src/content/calendar/diversions-game-night.md"
```

### Test Website

1. **CloudFront URL**: `https://d1234567890.cloudfront.net`
2. **S3 Website URL**: `http://your-bucket.s3-website-us-east-1.amazonaws.com`

## 🚨 Troubleshooting

### Common Issues

1. **API Gateway CORS errors:**
   - Check OPTIONS methods are deployed
   - Verify CORS headers in Lambda functions

2. **Lambda function errors:**
   - Check CloudWatch logs: `/aws/lambda/shifting-corridors-lodge-list-files-prod`
   - Verify S3 bucket permissions

3. **Content not loading:**
   - Verify files uploaded to correct S3 path
   - Check bucket name in Lambda environment variables

4. **SSL Certificate validation issues:**
   - Ensure both hosted zones exist in Route 53
   - Check DNS validation records are created automatically
   - Wait 5-30 minutes for certificate validation
   - Verify certificate is in us-east-1 region (required for CloudFront)

5. **Secondary domain not working:**
   - Run `npm run aws:test-domains` to verify both hosted zones exist
   - Check CloudFormation stack outputs for SecondaryDomainUrl
   - Verify DNS propagation: `dig shiftingcorridor.com`
   - Ensure both domains are in CloudFront aliases

### Dual Domain Verification

```bash
# Test domain configuration before deployment
npm run aws:test-domains

# Check SSL certificate status after deployment
npm run aws:check-ssl:prod

# Check DNS records after deployment
dig shiftingcorridors.com
dig shiftingcorridor.com

# Verify SSL certificate covers both domains
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --region us-east-1 \
  --query 'Certificate.SubjectAlternativeNames'

# Check CloudFront distribution aliases
aws cloudfront get-distribution \
  --id <distribution-id> \
  --query 'Distribution.DistributionConfig.Aliases'
```

### Emergency Fallback

Set environment variable to use hardcoded data:
```bash
export REACT_APP_USE_FALLBACK=true
npm run build
# Re-deploy website
```

## 🔄 CI/CD Integration

### GitHub Actions Setup

This repository includes automated CI/CD workflows:

- **CI Workflow:** Runs tests, type checking, and security scans on PRs
- **Deploy Workflow:** Automatically deploys to AWS on merge to main

**Setup Instructions:** See [.github/SETUP.md](.github/SETUP.md) for complete setup guide.

**Quick Setup:**
1. Add AWS credentials to GitHub secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Enable branch protection rules requiring status checks
3. Merge PRs trigger automatic production deployment

### Manual GitHub Actions Example

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: npm run aws:deploy:prod
```

## 💰 Cost Optimization

1. **Use S3 Intelligent Tiering** for content bucket
2. **Set CloudFront cache headers** for static assets
3. **Monitor Lambda execution time** and memory usage
4. **Use API Gateway caching** for frequently accessed content

## 🔒 Security Best Practices

1. **S3 bucket policies** restrict public access to content bucket
2. **IAM roles** follow least privilege principle
3. **API Gateway** has rate limiting enabled
4. **CloudFront** provides DDoS protection

## 📊 Monitoring

- **CloudWatch Logs**: Lambda function logs
- **CloudWatch Metrics**: API Gateway and Lambda metrics
- **S3 Access Logs**: Content access patterns
- **CloudFront Logs**: CDN performance