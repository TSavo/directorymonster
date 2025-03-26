#!/bin/bash

# Function to cleanup background processes on exit
cleanup() {
  echo "Cleaning up..."
  # Kill the Next.js server if it's running
  if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID
    echo "Next.js server stopped"
  fi
  exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM EXIT

echo -e "\033[0;34m===============================================\033[0m"
echo -e "\033[0;34m   DirectoryMonster Test Suite with Server     \033[0m"
echo -e "\033[0;34m===============================================\033[0m"

# Seed the data first
echo -e "\033[0;33mSeeding test data...\033[0m"
npm run seed

# Start Next.js server in the background
echo -e "\033[0;33mStarting Next.js server...\033[0m"
npm run dev &
SERVER_PID=$!

# Wait for server to start (adjust time as needed)
echo -e "\033[0;33mWaiting for server to start...\033[0m"
sleep 15

# Run all tests
echo -e "\033[0;33mRunning all tests...\033[0m"
npm run test:all

# Cleanup is handled by the trap