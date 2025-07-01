# AWS Deployment Guide

This document provides comprehensive instructions for deploying the Shifting Corridors Lodge website to AWS S3 with CloudFront distribution.

## Architecture Overview

The deployment uses the following AWS services:

- **S3 Bucket**: Hosts the static website files
- **CloudFront**: Global CDN for fast content delivery
- **IAM**: User and policies for deployment access
- **CloudFormation**: Infrastructure as Code for consistent deployments

## Prerequisites

### 1. AWS CLI Installation

Install the AWS CLI on your system:

**macOS:**
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download and run the AWS CLI MSI installer from the AWS website.

### 2. AWS CLI Configuration

Configure your AWS credentials:

```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

### 3. Required Permissions

Your AWS user needs the following permissions:
- CloudFormation full access
- S3 full access
- CloudFront full access
- IAM user creation and policy management

## Infrastructure Deployment

### 1. Deploy AWS Infrastructure

Navigate to the AWS directory and run the deployment script:

```bash
cd aws
./deploy-infrastructure.sh
```

This script will:
- Validate the CloudFormation template
- Create or update the infrastructure stack
- Set up S3 bucket with proper policies
- Create CloudFront distribution
- Create IAM user for deployments
- Display setup instructions

### 2. Optional: Custom Domain Setup

If you want to use a custom domain, you'll need:

1. **SSL Certificate**: Create an ACM certificate in `us-east-1` region
2. **Domain Configuration**: Set the parameters when deploying:

```bash
export DOMAIN_NAME="your-domain.com"
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
./deploy-infrastructure.sh
```

3. **DNS Configuration**: Point your domain to the CloudFront distribution

## GitHub Actions Setup

### 1. Repository Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following repository secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | Deployment user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Deployment user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for deployment | `us-east-1` |
| `S3_BUCKET_NAME` | S3 bucket name | `shifting-corridors-lodge-website-bucket` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890123` |

### 2. Automatic Deployment

Once secrets are configured, the GitHub Actions workflow will automatically:

1. **Trigger**: On every push to the `main` branch
2. **Build**: Install dependencies and build the React application
3. **Test**: Run the test suite with coverage
4. **Deploy**: Upload files to S3 with appropriate caching headers
5. **Invalidate**: Clear CloudFront cache for immediate updates

## Manual Deployment

For local or manual deployments:

### 1. Set Environment Variables

```bash
export S3_BUCKET_NAME="your-bucket-name"
export CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"
```

### 2. Run Deployment Script

```bash
npm run deploy:aws
```

This will:
- Build the application
- Verify the build output
- Upload static assets with long-term caching
- Upload HTML files with short-term caching
- Invalidate CloudFront cache

## Caching Strategy

The deployment uses a two-tier caching strategy:

### Static Assets (CSS, JS, Images)
- **S3 Cache**: `public, max-age=31536000` (1 year)
- **CloudFront Cache**: Long-term caching with versioned filenames
- **Strategy**: Aggressive caching since files are content-hashed

### HTML Files
- **S3 Cache**: `public, max-age=3600` (1 hour)
- **CloudFront Cache**: Short-term caching for faster updates
- **Strategy**: Minimal caching to ensure content freshness

## Monitoring and Troubleshooting

### 1. Deployment Logs

Check GitHub Actions logs for deployment issues:
- Build failures
- Test failures
- AWS deployment errors

### 2. CloudFormation Stack

Monitor the CloudFormation stack in AWS Console:
- Stack events for deployment progress
- Resource status for individual components
- Stack outputs for configuration values

### 3. S3 Bucket

Verify S3 bucket contents:
- Check file uploads
- Verify bucket policies
- Monitor access logs

### 4. CloudFront Distribution

Monitor CloudFront distribution:
- Check distribution status
- Monitor cache hit ratios
- Review invalidation requests

## Cost Optimization

### S3 Storage
- **Standard Storage**: Used for active website files
- **Lifecycle Policies**: Not needed for static sites
- **Estimated Cost**: $0.023 per GB per month

### CloudFront
- **Price Class 100**: Covers US, Canada, Europe (lowest cost)
- **Data Transfer**: $0.085 per GB for first 10TB
- **Requests**: $0.0075 per 10,000 requests

### Estimated Monthly Cost
For a typical static website:
- **S3 Storage (1GB)**: ~$0.02
- **CloudFront (10GB transfer)**: ~$0.85
- **Total**: ~$1.00 per month

## Security Considerations

### 1. IAM Permissions
- Deployment user has minimal required permissions
- No console access for deployment user
- Regular rotation of access keys recommended

### 2. S3 Bucket Security
- Public read access only for website files
- No public write access
- Server-side encryption enabled

### 3. CloudFront Security
- HTTPS redirect enforced
- Security headers policy applied
- Origin access control configured

## Backup and Recovery

### 1. Source Code
- Primary backup: Git repository
- Secondary backup: GitHub repository

### 2. Infrastructure
- Infrastructure as Code: CloudFormation template
- Configuration backup: Environment variables documentation

### 3. Recovery Process
1. Redeploy infrastructure using CloudFormation template
2. Configure GitHub Actions secrets
3. Trigger deployment from main branch

## Performance Optimization

### 1. Build Optimization
- Code splitting enabled
- Tree shaking for unused code
- Asset optimization and compression

### 2. CDN Configuration
- Global edge locations
- HTTP/2 support enabled
- Gzip compression enabled

### 3. Caching Headers
- Optimized cache control headers
- ETags for cache validation
- Conditional requests support

## Support and Maintenance

### Regular Tasks
- Monitor AWS costs monthly
- Review CloudFront cache hit ratios
- Update dependencies quarterly
- Rotate access keys annually

### Emergency Procedures
- Rollback: Deploy previous version from Git
- Hotfix: Direct S3 upload for critical fixes
- Outage: Check AWS service health dashboard

For additional support, refer to:
- AWS Documentation
- GitHub Actions Documentation
- React Build Documentation