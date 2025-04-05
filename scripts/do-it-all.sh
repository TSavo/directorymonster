#!/bin/bash
# do-it-all.sh - The "I can't be arsed" script that does everything

echo "🚀 DirectoryMonster - Doing EVERYTHING for you"
echo "==============================================="

# Check Node.js version
echo "🔍 Checking Node.js version..."
node scripts/check-node-version.js
if [ $? -ne 0 ]; then
  echo "❌ Node.js version check failed. Exiting."
  exit 1
fi

# Setup ZKP authentication
echo "🔐 Setting up ZKP authentication..."
npm run zkp:setup

# Verify the setup
echo "✅ Verifying ZKP setup..."
npm run test:crypto:setup

# Verify file integrity
echo "🔒 Verifying file integrity..."
npm run security:verify

# Build the application
echo "🏗️ Building the application..."
npm run build

# Start the application
echo "🚀 Starting the application..."
npm run start

echo "✨ DirectoryMonster is now running with ZKP authentication!"
