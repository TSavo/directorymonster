#!/bin/bash
# Complete test coverage script for Docker environment

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
COVERAGE_THRESHOLD=100

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE_THRESHOLD=$2
      shift 2
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

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   DirectoryMonster Docker Coverage Test Runner   ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}Using configuration: ${DOCKER_COMPOSE_FILE}${NC}"
echo -e "${BLUE}Coverage threshold: ${COVERAGE_THRESHOLD}%${NC}"
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
    return 0
  else
    echo -e "${RED}✗ ${test_name} failed!${NC}"
    echo ""
    ((FAILURES++))
    return 1
  fi
}

# Ensure containers are down before starting
echo -e "${YELLOW}Stopping any existing containers...${NC}"
$DOCKER_COMPOSE_CMD down
echo ""

# Start application
echo -e "${YELLOW}Building and starting application using ${DOCKER_COMPOSE_FILE}...${NC}"
$DOCKER_COMPOSE_CMD up -d --build
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

# Run seed script to populate data
echo -e "${YELLOW}Seeding test data...${NC}"
$DOCKER_COMPOSE_CMD exec -T app npm run seed:js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test data seeded successfully!${NC}"
else
  echo -e "${RED}Failed to seed test data!${NC}"
  ((FAILURES++))
fi
echo ""

# Run test suite with coverage
echo -e "${YELLOW}Running test suite with coverage...${NC}"
echo ""

# Create coverage directory if it doesn't exist
mkdir -p coverage

# Run unit tests with coverage
run_test "Unit Tests with Coverage" "$DOCKER_COMPOSE_CMD exec -T app npm test -- --coverage --coverageReporters='json-summary' --coverageReporters='lcov' --collectCoverageFrom='src/**/*.{ts,tsx}'"

# Run integration tests with coverage
run_test "Integration Tests with Coverage" "$DOCKER_COMPOSE_CMD exec -T app npm run test:integration -- --coverage --coverageReporters='json-summary' --coverageReporters='lcov' --collectCoverageFrom='src/**/*.{ts,tsx}'"

# Run domain tests
run_test "Domain Resolution Tests" "$DOCKER_COMPOSE_CMD exec -T app bash scripts/test-domain-resolution.sh"

# Run multitenancy tests
run_test "Multitenancy Tests" "$DOCKER_COMPOSE_CMD exec -T app bash scripts/test-multitenancy-comprehensive.sh"

# Run rendering tests
run_test "Page Rendering Tests" "$DOCKER_COMPOSE_CMD exec -T app bash scripts/test-comprehensive-rendering.sh"

# Extract coverage reports
echo -e "${YELLOW}Extracting coverage reports from container...${NC}"
$DOCKER_COMPOSE_CMD cp app:/app/coverage ./coverage-docker
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Coverage reports extracted successfully!${NC}"
else
  echo -e "${RED}Failed to extract coverage reports!${NC}"
  ((FAILURES++))
fi
echo ""

# Check coverage threshold
if [ -f "./coverage-docker/coverage-summary.json" ]; then
  echo -e "${YELLOW}Analyzing coverage results...${NC}"
  
  # Extract coverage percentage from JSON
  TOTAL_COVERAGE=$(cat ./coverage-docker/coverage-summary.json | grep -o '"pct":[0-9.]*' | head -1 | cut -d':' -f2)
  
  echo -e "Total coverage: ${TOTAL_COVERAGE}%"
  echo -e "Threshold: ${COVERAGE_THRESHOLD}%"
  
  if (( $(echo "$TOTAL_COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
    echo -e "${GREEN}✓ Coverage threshold met!${NC}"
  else
    echo -e "${RED}✗ Coverage threshold not met!${NC}"
    ((FAILURES++))
    
    # Find source files with low coverage
    echo -e "${YELLOW}Files with low coverage:${NC}"
    cat ./coverage-docker/coverage-summary.json | grep -A 10 "src/.*\.tsx\?" | grep -B 1 '"pct":[0-9.]*' | grep -B 1 '"pct":[0-9]\|"pct":[0-9][0-9]\.0*$' | grep -v "pct\|--" | cut -d'"' -f2
  fi
else
  echo -e "${RED}Coverage summary file not found!${NC}"
  ((FAILURES++))
fi
echo ""

# Generate HTML coverage report if lcov is available
if command -v genhtml >/dev/null 2>&1; then
  echo -e "${YELLOW}Generating HTML coverage report...${NC}"
  genhtml ./coverage-docker/lcov.info -o ./coverage-docker/html
  echo -e "${GREEN}HTML coverage report generated at ./coverage-docker/html/index.html${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}                Coverage Test Summary                ${NC}"
echo -e "${BLUE}====================================================${NC}"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed and coverage requirements met!${NC}"
else
  echo -e "${RED}${FAILURES} test groups failed or coverage requirement not met.${NC}"
fi
echo ""

# Cleanup
echo -e "${YELLOW}Stopping containers...${NC}"
$DOCKER_COMPOSE_CMD down
echo -e "${GREEN}Containers stopped.${NC}"

echo -e "${BLUE}Testing complete.${NC}"

if [ $FAILURES -eq 0 ]; then
  exit 0
else
  exit 1
fi