# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automated testing and AWS deployment.

## 🔧 Required Setup

### 1. AWS Credentials

Add these secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | Your AWS secret key |

**Creating AWS Credentials:**

1. Go to AWS IAM Console
2. Create a new user for GitHub Actions
3. Attach the following policies:
   - `CloudFormationFullAccess`
   - `S3FullAccess`
   - `LambdaFullAccess`
   - `APIGatewayFullAccess`
   - `CloudFrontFullAccess`
   - `Route53FullAccess`
   - `CertificateManagerFullAccess`
   - `IAMFullAccess`
4. Create access keys for the user
5. Add the keys to GitHub secrets

### 2. Branch Protection Rules

Set up branch protection to require tests to pass:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable these settings:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Select required status checks:
     - `test`
     - `validate-aws-template`
     - `security-scan`
   - ✅ **Restrict pushes that create files larger than 100MB**
   - ✅ **Require linear history** (optional)

### 3. Environment Protection (Optional)

For additional security on production deployments:

1. Go to **Settings** → **Environments**
2. Create environment: `prod`
3. Add protection rules:
   - ✅ **Required reviewers** (add team members)
   - ✅ **Wait timer** (optional delay before deployment)
   - ✅ **Deployment branches** (restrict to `main` branch only)

## 🚀 Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main`
- Pushes to `main`

**Jobs:**
1. **Test** - Runs TypeScript checks, tests, and build verification
2. **Validate AWS Template** - Validates CloudFormation template syntax
3. **Security Scan** - Runs npm audit for vulnerabilities

### Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Pushes to `main` (auto-deploy to production)
- Manual workflow dispatch (deploy to any environment)

**Jobs:**
1. **Deploy** - Deploys to specified AWS environment
2. **Notify** - Reports deployment status

## 📋 Usage

### Automatic Deployment

When you merge a PR to `main`:
1. CI tests run automatically
2. If tests pass, deployment to production starts
3. Dual domains are automatically configured
4. SSL certificates are validated
5. Deployment summary is posted

### Manual Deployment

To deploy to a specific environment:
1. Go to **Actions** tab
2. Select **Deploy to AWS** workflow
3. Click **Run workflow**
4. Choose environment (dev/staging/prod)
5. Click **Run workflow**

### Pull Request Process

1. Create feature branch
2. Make changes
3. Push to GitHub
4. Create pull request
5. CI tests run automatically
6. Tests must pass before merge is allowed
7. After merge, automatic deployment to production

## 🔍 Monitoring

### Deployment Status

Check deployment status in:
- **Actions** tab for workflow runs
- **Environments** tab for deployment history
- AWS CloudFormation console for stack status
- AWS CloudWatch for application logs

### Troubleshooting

**Common Issues:**

1. **AWS Credentials Invalid:**
   - Verify secrets are set correctly
   - Check IAM user has required permissions
   - Ensure access keys are active

2. **CloudFormation Validation Fails:**
   - Check template syntax
   - Verify all required parameters
   - Ensure resources are properly referenced

3. **Tests Failing:**
   - Check test output in Actions tab
   - Verify all dependencies are installed
   - Ensure TypeScript compilation succeeds

4. **Deployment Fails:**
   - Check AWS CloudFormation events
   - Verify hosted zones exist
   - Ensure SSL certificate validation completes

### Logs and Debugging

- **GitHub Actions logs:** Available in Actions tab
- **AWS CloudFormation:** Check stack events and outputs
- **AWS Lambda:** Check CloudWatch logs for function errors
- **AWS CloudFront:** Monitor distribution status

## 🔒 Security Best Practices

1. **Least Privilege:** IAM user has only required permissions
2. **Secret Rotation:** Regularly rotate AWS access keys
3. **Environment Protection:** Production requires approval
4. **Branch Protection:** Tests must pass before merge
5. **Audit Logging:** All deployments are logged and traceable

## 📊 Cost Monitoring

Monitor AWS costs for:
- CloudFormation stack resources
- Lambda function executions
- S3 storage and requests
- CloudFront data transfer
- Route 53 DNS queries

Set up AWS billing alerts to monitor monthly costs.