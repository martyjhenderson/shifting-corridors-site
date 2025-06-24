// Script to help with deploying to Cloudflare
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
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
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`\n${colors.green}✓ Command completed successfully${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}✗ Command failed with error: ${error.message}${colors.reset}\n`);
    return false;
  }
}

// Main deployment process
async function deploy() {
  console.log(`\n${colors.bright}${colors.cyan}Starting deployment process for Shifting Corridors Lodge${colors.reset}\n`);
  
  // Step 1: Build the project
  if (!runCommand('npm run build', 'Building project')) {
    console.error(`${colors.red}Build failed. Aborting deployment.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Verify the build
  if (!runCommand('node test-build.js', 'Verifying build output')) {
    console.error(`${colors.red}Build verification failed. Aborting deployment.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Deploy to Cloudflare
  console.log(`\n${colors.yellow}Deploying to Cloudflare...${colors.reset}\n`);
  if (!runCommand('wrangler deploy', 'Deploying to Cloudflare')) {
    console.error(`${colors.red}Deployment failed.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${colors.bright}${colors.green}Deployment completed successfully!${colors.reset}`);
  console.log(`${colors.cyan}Your site should now be available at https://shiftingcorridor.com${colors.reset}\n`);
}

// Run the deployment
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed with error: ${error.message}${colors.reset}`);
  process.exit(1);
});