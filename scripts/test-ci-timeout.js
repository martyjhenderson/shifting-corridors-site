#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🧪 Running tests in CI mode with hard timeout...');

// Set environment variables
process.env.CI = 'true';
process.env.NODE_ENV = 'test';
process.env.VITEST_POOL_THREADS = '1';
process.env.REACT_APP_USE_FALLBACK = 'true';

// Create a promise that rejects after 90 seconds
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error('Tests timed out after 90 seconds'));
  }, 90000);
});

// Create a promise that resolves when tests complete
const testPromise = new Promise((resolve, reject) => {
  const child = spawn('npx', ['vitest', 'run', '--config', 'vitest.config.ci.mjs', '--no-watch', '--run'], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Tests completed successfully');
      resolve();
    } else {
      reject(new Error(`Tests failed with exit code ${code}`));
    }
  });

  child.on('error', (error) => {
    reject(error);
  });
});

// Race between timeout and test completion
Promise.race([testPromise, timeoutPromise])
  .then(() => {
    console.log('Tests finished within timeout');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌', error.message);
    process.exit(1);
  });