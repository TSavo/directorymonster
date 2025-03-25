#!/bin/bash

# Script to run the API-based seeding with Docker

# Ensure the API service is running
echo "👉 Checking if Docker services are running..."
docker_status=$(docker-compose ps -q app 2>/dev/null)

if [ -z "$docker_status" ]; then
  echo "❌ Docker services are not running. Starting them now..."
  docker-compose up -d
  
  # Wait for services to start
  echo "⏳ Waiting for services to start (15s)..."
  sleep 15
else
  echo "✅ Docker services are already running"
fi

# Set API URL to point to the Docker service
export API_BASE_URL="http://localhost:3000/api"

# Check if API is accessible
echo "👉 Checking if API is running..."
curl -s $API_BASE_URL/healthcheck > /dev/null

if [ $? -ne 0 ]; then
  echo "❌ API is not accessible. Please check the Docker services."
  exit 1
fi

echo "✅ API is running at $API_BASE_URL"
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