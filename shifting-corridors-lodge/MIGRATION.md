# Migration from Cloudflare Workers to AWS S3

This document outlines the changes made to migrate the Shifting Corridors Lodge website from Cloudflare Workers to AWS S3 static hosting.

## Changes Made

### Dependencies Removed
- `wrangler` - Cloudflare Workers CLI
- `@cloudflare/kv-asset-handler` - Cloudflare KV storage handler
- `@craco/craco` - CRACO configuration (no longer needed)
- `concurrently` - Development server orchestration
- `buffer`, `process`, `stream-browserify`, `util`, `path-browserify` - Node.js polyfills
- `cors`, `express` - Server dependencies
- `moment` - Date library (can be replaced with native Date if needed)

### Dependencies Updated
- `react` - Updated to 19.1.0
- `react-dom` - Updated to 19.1.0
- `react-router-dom` - Updated to 6.30.1
- `typescript` - Updated to 5.1.6 (compatible with react-scripts)
- `web-vitals` - Updated to 3.5.2 (compatible version)
- `@testing-library/user-event` - Updated to 14.5.2
- `@types/jest` - Updated to 29.5.14
- `@types/node` - Updated to 22.10.5

### Dependencies Added
- `fathom-client` - For Fathom Analytics integration

### Files Removed
- `wrangler.toml` - Cloudflare Workers configuration
- `workers-site/` directory - Cloudflare Workers site files
- `deploy.js` - Cloudflare deployment script
- `server.js` - Express server file
- `craco.config.js` - CRACO configuration
- `src/polyfills.js` - Node.js polyfills

### Files Added
- `.github/workflows/deploy.yml` - GitHub Actions workflow for AWS deployment
- `deploy-aws.js` - AWS S3 deployment script
- `MIGRATION.md` - This migration documentation

### Configuration Changes
- Removed all Cloudflare Workers references
- Updated package.json scripts to remove Cloudflare-specific commands
- Added AWS deployment scripts and GitHub Actions workflow
- Removed Node.js polyfills from index.tsx

## Deployment

### Local Deployment
```bash
# Set environment variables
export S3_BUCKET_NAME=your-bucket-name
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id  # optional

# Deploy to AWS S3
npm run deploy:aws
```

### GitHub Actions Deployment
The project now includes a GitHub Actions workflow that automatically deploys to AWS S3 on pushes to the main branch. Required secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID` (optional)

## Build Verification
The build process now generates static files compatible with AWS S3 hosting. The `npm run verify-build` command validates the build output.

## Analytics
Fathom Analytics is already integrated in the HTML template and can be used with the `fathom-client` package for custom event tracking.