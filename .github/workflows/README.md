# GitHub Actions Setup

## Workflows Overview

This repository uses two main deployment workflows:

1. **Production Deployment** (`deploy-production.yml`) - Deploys to production when changes are merged to `main`
2. **Dev Deployment on PR** (`deploy-dev-on-pr.yml`) - Deploys to dev environment when PRs are opened/updated

## Production Deployment Workflow

The `deploy-production.yml` workflow automatically deploys to production when changes are merged to the `main` branch.

### Required Setup

#### 1. AWS IAM Role for GitHub Actions (OIDC)

Create an IAM role with the following trust policy to allow GitHub Actions to assume it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:martyjhenderson/shifting-corridors-site:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

#### 2. Required IAM Permissions

The role needs the following permissions:
- `s3:ListBucket` on the production S3 bucket
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on the production S3 bucket contents
- `cloudformation:DescribeStacks` for the production CloudFormation stack
- `cloudfront:CreateInvalidation` for cache invalidation
- `cloudfront:GetInvalidation` to check invalidation status

#### 3. GitHub Repository Secrets

Add the following secret to your GitHub repository:
- `AWS_ROLE_ARN`: The ARN of the IAM role created above

#### 4. GitHub OIDC Provider Setup

If not already configured, add the GitHub OIDC provider to your AWS account:
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### Workflow Behavior

- **Trigger**: Automatically runs when code is pushed to `main` branch
- **Manual Trigger**: Can be manually triggered via GitHub Actions UI
- **Authentication**: Uses AWS OIDC (no long-lived credentials)
- **Deployment**: Runs `npm run aws:upload:prod` to build and deploy
- **Feedback**: Provides success/failure notifications in the workflow logs

### Security Features

- Uses OpenID Connect (OIDC) for secure, temporary AWS credentials
- No long-lived AWS access keys stored in GitHub
- Restricted to only run from the `main` branch
- Requires code owner approval via CODEOWNERS file

## Dev Deployment on PR Workflow

The `deploy-dev-on-pr.yml` workflow automatically deploys to the dev environment when pull requests are opened, updated, or reopened against the `main` branch.

### Required Setup for Dev Deployment

#### 1. AWS IAM Role for Dev Environment (OIDC)

Create a separate IAM role for dev deployments with the following trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:martyjhenderson/shifting-corridors-site:pull_request"
        }
      }
    }
  ]
}
```

#### 2. Required IAM Permissions for Dev

The dev role needs the following permissions:
- `s3:ListBucket` on the dev S3 bucket
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on the dev S3 bucket contents
- `cloudformation:DescribeStacks` for the dev CloudFormation stack
- `cloudfront:CreateInvalidation` for dev cache invalidation
- `cloudfront:GetInvalidation` to check invalidation status

#### 3. Additional GitHub Repository Secrets

Add the following secret for dev deployment:
- `AWS_ROLE_ARN_DEV`: The ARN of the dev IAM role created above

### Dev Workflow Behavior

- **Trigger**: Automatically runs when PRs are opened, updated, or reopened against `main`
- **Manual Trigger**: Can be manually triggered via GitHub Actions UI
- **Authentication**: Uses AWS OIDC (no long-lived credentials)
- **Deployment**: Runs `npm run aws:upload:dev` to build and deploy to dev environment
- **Feedback**: Comments on the PR with deployment status and preview links
- **Preview URL**: https://dev.shiftingcorridors.com

### PR Comments

The workflow automatically adds comments to PRs with:
- ✅ Success: Preview link and deployment details
- ❌ Failure: Error notification with link to logs

## Security Notes

- Both workflows use OpenID Connect (OIDC) for secure, temporary AWS credentials
- No long-lived AWS access keys are stored in GitHub
- Production deployment is restricted to the `main` branch only
- Dev deployment is restricted to pull requests only
- Each environment uses separate IAM roles with minimal required permissions