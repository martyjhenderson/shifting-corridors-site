#!/bin/bash

# Aggressive CI test script that forces exit
set -e

echo "🧪 Running tests in CI mode..."

# Set CI environment variables
export CI=true
export NODE_ENV=test
export VITEST_POOL_THREADS=1
export REACT_APP_USE_FALLBACK=true

# Run tests with explicit flags to prevent hanging
vitest run --config vitest.config.ci.mjs --no-watch --run

echo "✅ Tests completed successfully"

# Force exit to prevent hanging
exit 0