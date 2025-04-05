#!/bin/bash
# docker-do-it-all.sh - The "I can't be arsed" Docker script

echo "🐳 DirectoryMonster - Dockerizing EVERYTHING for you"
echo "==================================================="

# Check Node.js version
echo "🔍 Checking Node.js version..."
node scripts/check-node-version.js
if [ $? -ne 0 ]; then
  echo "❌ Node.js version check failed. Exiting."
  exit 1
fi

# Build and start the Docker containers
echo "🏗️ Building and starting Docker containers..."
docker-compose -f docker/docker-compose.all-in-one.yml up --build -d

echo "✨ DirectoryMonster is now running in Docker!"
echo "📱 Access the application at: http://localhost:3000"
