#!/bin/bash

# Ensure the API is running before attempting to seed
echo "👉 Checking if API is running..."
# Check port 3000 first, if it fails try port 3001
curl -s http://localhost:3000/api/healthcheck > /dev/null || curl -s http://localhost:3001/api/healthcheck > /dev/null

if [ $? -ne 0 ]; then
  echo "❌ API is not running. Please start the server first with 'npm run dev' or 'docker-compose up'"
  exit 1
fi

echo "✅ API is running"
echo "🌱 Running API-based seeding script..."

# Run TypeScript version using ts-node
if ! command -v ts-node &> /dev/null; then
  echo "ts-node is not installed. Installing it temporarily..."
  npx ts-node scripts/seed-data.ts
else
  ts-node scripts/seed-data.ts
fi

if [ $? -eq 0 ]; then
  echo "✅ API seeding completed successfully"
else
  echo "❌ API seeding failed"
  exit 1
fi