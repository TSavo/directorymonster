#!/bin/bash
# Complete test suite runner for Docker environment

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set default environment
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKER_COMPOSE_CMD="docker-compose"
MAX_RETRIES=10
WAIT_TIME=30

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dev)
      DOCKER_COMPOSE_FILE="docker-compose.dev.yml"
      DOCKER_COMPOSE_CMD="docker-compose -f docker-compose.dev.yml"
      shift
      ;;
    --prod)
      DOCKER_COMPOSE_FILE="docker-compose.yml"
      DOCKER_COMPOSE_CMD="docker-compose"
      shift
      ;;
    --wait)
      WAIT_TIME=$2
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   DirectoryMonster Docker Test Suite Runner   ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}Using configuration: ${DOCKER_COMPOSE_FILE}${NC}"
echo ""

# Track failures
FAILURES=0

# Function to run a test and track status
run_test() {
  local test_name=$1
  local command=$2
  
  echo -e "${YELLOW}Running test: ${test_name}${NC}"
  echo -e "Command: ${command}"
  echo ""
  
  # Run the command
  eval $command
  
  # Check exit status
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${test_name} passed!${NC}"
    echo ""
  else
    echo -e "${RED}✗ ${test_name} failed!${NC}"
    echo ""
    ((FAILURES++))
  fi
}

# Ensure containers are down before starting
echo -e "${YELLOW}Stopping any existing containers...${NC}"
$DOCKER_COMPOSE_CMD down
echo ""

# Start application
echo -e "${YELLOW}Starting application using ${DOCKER_COMPOSE_FILE}...${NC}"
$DOCKER_COMPOSE_CMD up -d
echo ""

# Wait for application to start
echo -e "${YELLOW}Waiting for application to start (${WAIT_TIME}s)...${NC}"
sleep $WAIT_TIME

# Loop to check if application is running with retries
echo -e "${YELLOW}Checking if application is running...${NC}"
for i in $(seq 1 $MAX_RETRIES); do
  curl -s --max-time 5 --head --request GET http://localhost:3000 | grep "200 OK" > /dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Application is running on http://localhost:3000!${NC}"
    break
  else
    if [ $i -eq $MAX_RETRIES ]; then
      echo -e "${RED}Failed to start application after ${MAX_RETRIES} attempts. Exiting.${NC}"
      # Show logs for debugging
      echo -e "${YELLOW}Container logs:${NC}"
      $DOCKER_COMPOSE_CMD logs
      $DOCKER_COMPOSE_CMD down
      exit 1
    else
      echo -e "${YELLOW}Attempt $i: Application not ready. Waiting...${NC}"
      sleep 10
    fi
  fi
done
echo ""

# Test Redis connection
echo -e "${YELLOW}Testing Redis connection...${NC}"
for i in $(seq 1 $MAX_RETRIES); do
  curl -s --max-time 5 --head --request GET http://localhost:3000/api/healthcheck | grep "200 OK" > /dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Redis connection test passed!${NC}"
    break
  else
    if [ $i -eq $MAX_RETRIES ]; then
      echo -e "${RED}Redis connection test failed after ${MAX_RETRIES} attempts!${NC}"
      ((FAILURES++))
    else
      echo -e "${YELLOW}Attempt $i: Redis not ready. Waiting...${NC}"
      sleep 5
    fi
  fi
done
echo ""

# Run test suite
echo -e "${YELLOW}Running test suite...${NC}"
echo ""

# Run domain resolution tests
run_test "Basic Domain Resolution" "bash scripts/test-domain-resolution.sh"

# Run comprehensive multitenancy tests
run_test "Comprehensive Multitenancy" "bash scripts/test-multitenancy-comprehensive.sh"

# Run page rendering tests
run_test "Page Rendering Tests" "bash scripts/test-comprehensive-rendering.sh"

# Summary
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}                Test Summary                   ${NC}"
echo -e "${BLUE}===============================================${NC}"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}${FAILURES} test groups failed.${NC}"
fi
echo ""

# Ask if user wants to stop containers
if [ -t 0 ]; then  # Only ask if running interactively
  echo -e "${YELLOW}Do you want to stop the application containers? (y/n)${NC}"
  read -r stop_containers

  if [[ $stop_containers =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping containers...${NC}"
    $DOCKER_COMPOSE_CMD down
    echo -e "${GREEN}Containers stopped.${NC}"
  fi
else
  # If running non-interactively, always stop containers
  echo -e "${YELLOW}Stopping containers...${NC}"
  $DOCKER_COMPOSE_CMD down
  echo -e "${GREEN}Containers stopped.${NC}"
fi

echo -e "${BLUE}Testing complete.${NC}"

if [ $FAILURES -eq 0 ]; then
  exit 0
else
  exit 1
fi