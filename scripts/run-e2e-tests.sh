#!/bin/bash

# Enhanced E2E test runner with robust database verification
# This script ensures the required test data exists before running tests

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   DirectoryMonster E2E Test Runner   ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if server is running
echo -e "\n${YELLOW}Checking if server is running...${NC}"
if ! curl -s http://localhost:3000/api/healthcheck > /dev/null; then
  echo -e "${YELLOW}Server not detected. Starting server in background...${NC}"
  npm run dev &
  SERVER_PID=$!
  
  # Wait for server to start
  echo -e "${YELLOW}Waiting for server to start...${NC}"
  for i in {1..30}; do
    if curl -s http://localhost:3000/api/healthcheck > /dev/null; then
      echo -e "${GREEN}Server started successfully!${NC}"
      break
    fi
    
    if [ $i -eq 30 ]; then
      echo -e "${RED}Server failed to start in time. Aborting.${NC}"
      kill $SERVER_PID 2>/dev/null
      exit 1
    fi
    
    echo -n "."
    sleep 1
  done
else
  echo -e "${GREEN}Server is already running.${NC}"
fi

# Clear Redis users for clean test environment
echo -e "\n${YELLOW}Clearing Redis users for clean test environment...${NC}"
npm run clear-redis-users

# Verify and prepare seed data
echo -e "\n${YELLOW}Verifying seed data...${NC}"
node scripts/verify-seed-data.js

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to verify or create seed data. Some tests may fail.${NC}"
  echo -e "${YELLOW}Continuing with tests anyway...${NC}"
fi

# Run the first user setup test first
echo -e "\n${YELLOW}Running first user setup test...${NC}"
jest "tests/e2e/first-user.test.js" --testTimeout=60000

# If first-user test fails, abort
if [ $? -ne 0 ]; then
  echo -e "${RED}First user setup test failed. Aborting remaining tests.${NC}"
  
  # Kill server if we started it
  if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping server...${NC}"
    kill $SERVER_PID 2>/dev/null
  fi
  
  exit 1
fi

# Run the remaining E2E tests
echo -e "\n${YELLOW}Running E2E tests...${NC}"
TESTS_TO_RUN="tests/e2e/login.test.js tests/e2e/admin-dashboard.test.js tests/e2e/categories.test.js"

# Run tests with extended timeout and better output formatting
jest $TESTS_TO_RUN --testTimeout=60000 --verbose

# Store the test result
TEST_RESULT=$?

# Clean up
if [ ! -z "$SERVER_PID" ]; then
  echo -e "\n${YELLOW}Stopping server...${NC}"
  kill $SERVER_PID 2>/dev/null
fi

# Final summary
echo -e "\n${BLUE}=======================================${NC}"
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}All E2E tests completed successfully!${NC}"
else
  echo -e "${RED}Some E2E tests failed. Check the logs for details.${NC}"
fi
echo -e "${BLUE}=======================================${NC}"