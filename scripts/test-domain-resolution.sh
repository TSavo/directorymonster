#!/bin/sh
# Test domain-based site resolution

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing domain-based site resolution...${NC}"
echo ""

# Test domains and expected names
test_domain() {
  local domain=$1
  local expected_name=$2
  local port=${3:-3000}  # Default to port 3000 (inside container)
  
  echo -e "${YELLOW}Testing http://${domain}:${port}${NC}"
  
  # Use wget to get the page title
  result=$(wget -qO- "http://${domain}:${port}" | grep -o '<h1[^>]*>[^<]*</h1>' | head -1)
  
  # Extract site name from result (between h1 tags)
  site_name=$(echo "$result" | sed -E 's/<h1[^>]*>([^<]*)<\/h1>/\1/')
  
  echo -e "  Domain: ${domain}"
  echo -e "  Expected: ${expected_name}"
  echo -e "  Actual: ${site_name}"
  
  if echo "$site_name" | grep -q "$expected_name"; then
    echo -e "  ${GREEN}PASS: Domain resolves to correct site${NC}"
    return 0
  else
    echo -e "  ${RED}FAIL: Domain resolves to wrong site${NC}"
    return 1
  fi
}

# Also test the API endpoints for more detailed info
test_api() {
  local domain=$1
  local expected_slug=$2
  local port=${3:-3000}  # Default to port 3000 (inside container)
  
  echo -e "${YELLOW}Testing API: http://${domain}:${port}/api/site-info${NC}"
  
  # Use wget to get the API response
  result=$(wget -qO- "http://${domain}:${port}/api/site-info")
  
  # Extract site name and slug
  site_name=$(echo "$result" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  site_slug=$(echo "$result" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
  requested_hostname=$(echo "$result" | grep -o '"requestedHostname":"[^"]*"' | cut -d'"' -f4)
  
  echo -e "  Domain: ${domain}"
  echo -e "  Expected slug: ${expected_slug}"
  echo -e "  Actual slug: ${site_slug}"
  echo -e "  Site name: ${site_name}"
  echo -e "  Requested hostname: ${requested_hostname}"
  
  if [ "$site_slug" = "$expected_slug" ]; then
    echo -e "  ${GREEN}PASS: API returns correct site${NC}"
    return 0
  else
    echo -e "  ${RED}FAIL: API returns wrong site${NC}"
    return 1
  fi
}

# Test all domains
echo "==== Testing main domains ===="
test_domain "fishinggearreviews.com" "Fishing Gear Reviews"
echo ""
test_domain "hikinggearreviews.com" "Hiking Gear Directory" 
echo ""

echo "==== Testing subdomains ===="
test_domain "fishing-gear.mydirectory.com" "Fishing Gear Reviews"
echo ""
test_domain "hiking-gear.mydirectory.com" "Hiking Gear Directory"
echo ""

echo "==== Testing API endpoints ===="
test_api "fishinggearreviews.com" "fishing-gear"
echo ""
test_api "hikinggearreviews.com" "hiking-gear"
echo ""
test_api "fishing-gear.mydirectory.com" "fishing-gear"
echo ""
test_api "hiking-gear.mydirectory.com" "hiking-gear"
echo ""

echo -e "${YELLOW}Testing complete!${NC}"