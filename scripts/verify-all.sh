#!/bin/bash
# verify-all.sh - Verify EVERYTHING

echo "🔍 DirectoryMonster - Verifying EVERYTHING"
echo "========================================"

# Check Node.js version
echo "🔍 Checking Node.js version..."
node scripts/check-node-version.js
if [ $? -ne 0 ]; then
  echo "❌ Node.js version check failed. Exiting."
  exit 1
fi

# Verify ZKP setup
echo "🔐 Verifying ZKP setup..."
npm run test:crypto:setup

# Verify file integrity
echo "🔒 Verifying file integrity..."
npm run security:verify

# Run security audit
echo "🛡️ Running security audit..."
npm run security:audit

echo "✅ All verification checks completed!"
