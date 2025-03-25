#!/bin/bash
# Comprehensive multitenancy testing script

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# TEST VARIABLES
PORT=3000
SUCCESS_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   DirectoryMonster Multitenancy Test Suite    ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Function to test a domain with its expected site slug
test_domain() {
  local domain=$1
  local expected_slug=$2
  local test_description=$3
  
  echo -e "${YELLOW}Test: ${test_description}${NC}"
  echo -e "  Domain: ${domain}"
  echo -e "  Expected slug: ${expected_slug}"
  
  # Test 1: Homepage content
  echo -e "  ${BLUE}Testing homepage content...${NC}"
  
  homepage_content=$(curl -s -H "Host: ${domain}" "http://localhost:${PORT}")
  if echo "$homepage_content" | grep -q "$expected_slug"; then
    echo -e "    ${GREEN}✓ Homepage contains site slug${NC}"
    ((SUCCESS_COUNT++))
  else
    echo -e "    ${RED}✗ Homepage does not contain site slug${NC}"
    ((FAIL_COUNT++))
  fi
  
  # Test 2: API endpoint for site-info
  echo -e "  ${BLUE}Testing site-info API...${NC}"
  
  api_response=$(curl -s -H "Host: ${domain}" "http://localhost:${PORT}/api/site-info")
  site_slug=$(echo "$api_response" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  echo -e "    API returned slug: ${site_slug}"
  
  if [ "$site_slug" = "$expected_slug" ]; then
    echo -e "    ${GREEN}✓ API returned correct site slug${NC}"
    ((SUCCESS_COUNT++))
  else
    echo -e "    ${RED}✗ API returned wrong site slug${NC}"
    ((FAIL_COUNT++))
  fi
  
  # Test 3: Request headers (very important for debugging)
  echo -e "  ${BLUE}Testing request headers...${NC}"
  
  header_response=$(curl -s -H "Host: ${domain}" -I "http://localhost:${PORT}/api/site-info" | grep -i "host:")
  echo -e "    Headers sent: ${header_response}"
  
  # This helps diagnose if headers are being properly sent and received
  if echo "$header_response" | grep -q "${domain}"; then
    echo -e "    ${GREEN}✓ Host header properly set${NC}"
    ((SUCCESS_COUNT++))
  else
    echo -e "    ${RED}✗ Host header not set correctly${NC}"
    ((FAIL_COUNT++))
  fi
  
  echo ""
}

# Function to test all variations of a domain
test_site() {
  local main_domain=$1
  local subdomain=$2
  local slug=$3
  local site_name=$4
  
  echo -e "${BLUE}=== Testing site: ${site_name} (${slug}) ===${NC}"
  echo ""
  
  # Test main domain
  test_domain "${main_domain}" "${slug}" "Main domain (${main_domain})"
  
  # Test with port
  test_domain "${main_domain}:${PORT}" "${slug}" "Domain with port (${main_domain}:${PORT})"
  
  # Test subdomain format
  test_domain "${subdomain}.mydirectory.com" "${slug}" "Subdomain format (${subdomain}.mydirectory.com)"
  
  # Test with query param (simulating client-side testing)
  test_domain "localhost?hostname=${main_domain}" "${slug}" "Hostname in query param (?hostname=${main_domain})"
  
  echo -e "${BLUE}=== Completed tests for ${site_name} ===${NC}"
  echo ""
}

# RUN TESTS FOR EACH SITE
test_site "fishinggearreviews.com" "fishing-gear" "fishing-gear" "Fishing Gear Reviews"
test_site "hikinggearreviews.com" "hiking-gear" "hiking-gear" "Hiking Gear Directory"

# SUMMARY
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}                Test Summary                   ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Tests passed: ${GREEN}${SUCCESS_COUNT}${NC}"
echo -e "Tests failed: ${RED}${FAIL_COUNT}${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check the results above.${NC}"
  exit 1
fi