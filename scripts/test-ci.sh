#!/bin/bash

# Aggressive CI test script that forces exit
set -e

# Run tests with Node.js timeout wrapper
node scripts/test-ci-timeout.js

# Force exit to prevent hanging
exit 0