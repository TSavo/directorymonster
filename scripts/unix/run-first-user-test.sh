#!/bin/bash
# Script to run the first user E2E test

# Stop running containers
echo "Stopping Docker containers..."
docker-compose down

# Start containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for the server to be ready
echo "Waiting for server to start..."
sleep 10

# Clear users via API
echo "Clearing users via API..."
curl -X POST http://localhost:3000/api/test/clear-users

# Run the first user test
echo "Running first user E2E test..."
npx jest --testPathPattern=tests/e2e/first-user.test.js
