// AWS S3 deployment script for local development
const { execSync } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper function to run a command and log output
function runCommand(command, description) {
    console.log(`\n${colors.bright}${colors.blue}=== ${description} ===${colors.reset}\n`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`\n${colors.green}✓ Command completed successfully${colors.reset}\n`);
        return true;
    } catch (error) {
        console.error(`\n${colors.red}✗ Command failed with error: ${error.message}${colors.reset}\n`);
        return false;
    }
}

// Check for required environment variables
function checkEnvironment() {
    const required = ['S3_BUCKET_NAME'];
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        console.error(`${colors.red}Missing required environment variables: ${missing.join(', ')}${colors.reset}`);
        console.log(`${colors.yellow}Please set the following environment variables:${colors.reset}`);
        console.log(`${colors.cyan}export S3_BUCKET_NAME=your-bucket-name${colors.reset}`);
        console.log(`${colors.cyan}export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id (optional)${colors.reset}`);
        return false;
    }
    return true;
}

// Main deployment process
async function deploy() {
    console.log(`\n${colors.bright}${colors.cyan}Starting AWS S3 deployment for Shifting Corridors Lodge${colors.reset}\n`);

    if (!checkEnvironment()) {
        process.exit(1);
    }

    // Step 1: Build the project
    if (!runCommand('npm run build', 'Building project')) {
        console.error(`${colors.red}Build failed. Aborting deployment.${colors.reset}`);
        process.exit(1);
    }

    // Step 2: Verify the build
    if (!runCommand('npm run verify-build', 'Verifying build output')) {
        console.error(`${colors.red}Build verification failed. Aborting deployment.${colors.reset}`);
        process.exit(1);
    }

    // Step 3: Deploy to S3
    console.log(`\n${colors.yellow}Deploying to AWS S3...${colors.reset}\n`);

    // Deploy static assets with long cache
    const s3SyncAssets = `aws s3 sync build/ s3://${process.env.S3_BUCKET_NAME} --delete --cache-control "public,max-age=31536000" --exclude "*.html"`;
    if (!runCommand(s3SyncAssets, 'Deploying static assets to S3')) {
        console.error(`${colors.red}Asset deployment failed.${colors.reset}`);
        process.exit(1);
    }

    // Deploy HTML files with short cache
    const s3SyncHtml = `aws s3 sync build/ s3://${process.env.S3_BUCKET_NAME} --delete --cache-control "public,max-age=3600" --include "*.html"`;
    if (!runCommand(s3SyncHtml, 'Deploying HTML files to S3')) {
        console.error(`${colors.red}HTML deployment failed.${colors.reset}`);
        process.exit(1);
    }

    // Step 4: Invalidate CloudFront (if configured)
    if (process.env.CLOUDFRONT_DISTRIBUTION_ID) {
        console.log(`\n${colors.yellow}Invalidating CloudFront cache...${colors.reset}\n`);
        const invalidateCommand = `aws cloudfront create-invalidation --distribution-id ${process.env.CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"`;
        if (!runCommand(invalidateCommand, 'Invalidating CloudFront cache')) {
            console.warn(`${colors.yellow}CloudFront invalidation failed, but deployment was successful.${colors.reset}`);
        }
    }

    console.log(`\n${colors.bright}${colors.green}Deployment completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}Your site should now be available at your S3 bucket URL or CloudFront distribution.${colors.reset}\n`);
}

// Run the deployment
deploy().catch(error => {
    console.error(`${colors.red}Deployment failed with error: ${error.message}${colors.reset}`);
    process.exit(1);
});