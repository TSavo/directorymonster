#!/bin/bash
# Script to run the categories E2E test with enhanced debugging

# Create logs directories if they don't exist
mkdir -p debug-logs
mkdir -p html-dumps

# Clear old logs
echo "Clearing old debug logs..."
rm -rf debug-logs/*
rm -rf html-dumps/*

# Set debug environment variable
export DEBUG=true

# Set longer timeouts
export PUPPETEER_TIMEOUT=60000

# Run the test with detailed output
echo "Running categories E2E test with enhanced debugging..."
npm run test:e2e:categories -- --verbose 2>&1 | tee categories-test-output.log

# Summary of logs
echo "------------------------------------"
echo "Test complete. Debug logs summary:"
echo "------------------------------------"
echo "HTML dumps: $(ls html-dumps | wc -l) files"
echo "Debug logs: $(ls debug-logs | wc -l) files"
echo "Log locations:"
echo "  - HTML dumps: ./html-dumps/"
echo "  - Debug logs: ./debug-logs/"
echo "  - Test output: ./categories-test-output.log"
echo "------------------------------------"
