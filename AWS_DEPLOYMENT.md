# AWS Static Site Deployment Guide

This guide explains how to deploy the Shifting Corridors Lodge static site using AWS S3, CloudFront, and Route 53.

## 🏗️ Architecture

- **Frontend**: Static React SPA built with Vite
- **Content**: Markdown files converted to JSON at build time
- **Hosting**: S3 bucket with CloudFront CDN
- **Domains**: Route 53 DNS with SSL certificates
- **Analytics**: Fathom Analytics (Site ID: ELTMMRHY)

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
   - CloudFront (full access)
   - Route 53 (hosted zone access)
   - Certificate Manager (full access)

3. **Domain setup:**
   - Hosted zones must exist for your domains
   - DNS must be pointing to Route 53

### Deploy to Production

```bash
# Deploy to production with dual domain support
npm run aws:deploy:prod
```

**Production Environment:**
- **Primary Domain**: https://shiftingcorridors.com + https://www.shiftingcorridors.com
- **Secondary Domain**: https://shiftingcorridor.com + https://www.shiftingcorridor.com
- **Single CloudFront Distribution**: Serves all 4 domain variants
- **SSL Certificate**: Covers all domains with automatic DNS validation
- **Hosted Zones**: 
  - shiftingcorridors.com (Z03318772B503VRJ8T1YH)
  - shiftingcorridor.com (Z04363683RARVTPC87S05)

All domains point to the same CloudFront distribution and serve identical content.

### Deploy to Development

```bash
# Deploy to development environment with full infrastructure
npm run aws:deploy:dev
```

**Development Environment:**
- **Domain**: https://dev.shiftingcorridors.com
- **CloudFront Distribution**: E2M216M8CK1SMX  
- **S3 Bucket**: shifting-corridors-lodge-website-dev
- **SSL Certificate**: Automatically provisioned and validated

**Note**: After first deployment, DNS propagation may take up to 30 minutes. The site includes:
- SSL certificate for HTTPS
- CloudFront CDN for fast global delivery
- Route 53 DNS configuration
- Static content from existing S3 bucket

## 🔧 Manual Deployment Steps

If you prefer to deploy manually:

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build content and application
npm run build
```

### 2. Deploy Infrastructure

```bash
# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file aws/cloudformation/static-infrastructure.yaml \
    --stack-name shifting-corridors-lodge-static-prod \
    --parameter-overrides \
        ProjectName=shifting-corridors-lodge \
        Environment=prod \
        PrimaryDomainName=shiftingcorridors.com \
        SecondaryDomainName=shiftingcorridor.com \
    --capabilities CAPABILITY_IAM \
    --region us-east-1
```

### 3. Upload Website Files

```bash
# Get bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name shifting-corridors-lodge-static-prod \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

# Upload files with appropriate caching
aws s3 sync build/ s3://$BUCKET_NAME/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html"

# Upload HTML files with no cache
aws s3 sync build/ s3://$BUCKET_NAME/ \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html"
```

### 4. Invalidate CloudFront Cache

```bash
# Get distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name shifting-corridors-lodge-static-prod \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

# Create invalidation
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"
```

## 🌐 Domain Configuration

### Production Domains
- Primary: `shiftingcorridors.com` + `www.shiftingcorridors.com`
- Secondary: `shiftingcorridor.com` + `www.shiftingcorridor.com`
- All domains point to the same CloudFront distribution

### Development Domain
- `dev.shiftingcorridors.com`

### SSL Certificates
- Single certificate covers all domain variants
- Automatic DNS validation through Route 53
- Minimum TLS 1.2 enforced

## 📊 Analytics

The site includes Fathom Analytics with:
- Site ID: `ELTMMRHY`
- SPA mode enabled for client-side routing
- Privacy-focused, GDPR compliant

## 🔄 Content Updates

Content is managed through markdown files. See [CONTENT_UPDATE_GUIDE.md](CONTENT_UPDATE_GUIDE.md) for detailed instructions.

### Quick Content Update

1. Edit markdown files in `src/content/`
2. Commit and push changes
3. Run deployment script:
   ```bash
   ./aws/scripts/deploy-static.sh prod
   ```

## 🛠️ Development

### Local Development

```bash
# Start development server
npm start

# This will:
# 1. Build content from markdown files
# 2. Start Vite dev server on port 3000
```

### Testing Build

```bash
# Build and preview locally
npm run build
npm run preview
```

## 📋 Environment Variables

No runtime environment variables needed. All configuration is build-time.

## 🗂️ Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── content/            # Markdown content files
│   │   ├── calendar/       # Event files
│   │   ├── news/          # News articles
│   │   └── gamemasters/   # GM profiles
│   ├── data/              # Generated JSON data (build-time)
│   └── utils/             # Utilities and static data loader
├── aws/
│   ├── cloudformation/    # Infrastructure templates
│   └── scripts/          # Deployment scripts
├── scripts/              # Build scripts
└── public/              # Static assets
```

## 🚨 Troubleshooting

### Common Issues

**SSL Certificate Validation:**
- Can take up to 30 minutes
- Ensure DNS is pointing to Route 53
- Check domain validation records

**CloudFront Cache:**
- Changes may take up to 15 minutes to propagate
- Use invalidation for immediate updates
- Check cache headers on S3 objects

**Build Failures:**
- Check markdown file syntax
- Ensure all required frontmatter fields are present
- Verify YAML formatting (quotes around titles with colons)

### Useful Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name shifting-corridors-lodge-static-prod

# Check certificate status
aws acm list-certificates --region us-east-1

# Check CloudFront distribution
aws cloudfront list-distributions

# Test domain resolution
nslookup shiftingcorridors.com

# Check SSL certificate
openssl s_client -connect shiftingcorridors.com:443 -servername shiftingcorridors.com
```

## 💰 Cost Optimization

The static architecture is highly cost-effective:

- **S3**: ~$1-5/month for storage and requests
- **CloudFront**: ~$1-10/month for CDN (first 1TB free)
- **Route 53**: $0.50/month per hosted zone
- **Certificate Manager**: Free for AWS resources

**Removed costs** (compared to previous architecture):
- Lambda functions: ~$5-15/month
- API Gateway: ~$3-10/month

## 🔐 Security

- All traffic forced to HTTPS
- S3 bucket configured for website hosting only
- CloudFront handles all public access
- No server-side components to secure
- Static files only - no dynamic vulnerabilities

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

### GitHub Actions Example

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run aws:deploy:prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
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