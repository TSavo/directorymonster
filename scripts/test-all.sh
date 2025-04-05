#!/bin/bash
# test-all.sh - Run ALL the tests

echo "🧪 DirectoryMonster - Running ALL tests"
echo "======================================"

# Check Node.js version
echo "🔍 Checking Node.js version..."
node scripts/check-node-version.js
if [ $? -ne 0 ]; then
  echo "❌ Node.js version check failed. Exiting."
  exit 1
fi

# Run crypto tests
echo "🔐 Running crypto tests..."
npm run test:crypto

# Run security tests
echo "🔒 Running security tests..."
npm run test:crypto:security

# Verify file integrity
echo "📝 Verifying file integrity..."
npm run security:verify

# Run core ZKP tests
echo "🧮 Running core ZKP tests..."
npm run test:crypto:core

# Run ZKP setup verification
echo "🔍 Verifying ZKP setup..."
npm run test:crypto:setup

echo "✅ All tests completed!"
