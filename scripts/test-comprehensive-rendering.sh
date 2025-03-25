#!/bin/bash
# Comprehensive page rendering test script
# Tests all major page types across multiple domains

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test settings
PORT=3000
SUCCESS_COUNT=0
FAIL_COUNT=0
TEST_COUNT=0

# Domain test data
declare -A SITE_DATA=(
  ["fishinggearreviews.com"]="fishing-gear|Fishing Gear Reviews"
  ["hikinggearreviews.com"]="hiking-gear|Hiking Gear Directory"
  ["fishing-gear.mydirectory.com"]="fishing-gear|Fishing Gear Reviews"
  ["hiking-gear.mydirectory.com"]="hiking-gear|Hiking Gear Directory"
)

# Create temporary directory for downloaded files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}  DirectoryMonster Page Rendering Test Suite   ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# General test function - checks if a string exists in the response
test_contains() {
  local content=$1
  local expected=$2
  local description=$3

  ((TEST_COUNT++))
  
  echo -e "  ${CYAN}Testing: ${description}${NC}"
  if echo "$content" | grep -q "$expected"; then
    echo -e "    ${GREEN}✓ PASS: Content contains \"$expected\"${NC}"
    ((SUCCESS_COUNT++))
    return 0
  else
    echo -e "    ${RED}✗ FAIL: Content does not contain \"$expected\"${NC}"
    ((FAIL_COUNT++))
    return 1
  fi
}

# Test function for checking if content doesn't contain a string
test_not_contains() {
  local content=$1
  local unexpected=$2
  local description=$3

  ((TEST_COUNT++))
  
  echo -e "  ${CYAN}Testing: ${description}${NC}"
  if echo "$content" | grep -q "$unexpected"; then
    echo -e "    ${RED}✗ FAIL: Content contains \"$unexpected\" (should not)${NC}"
    ((FAIL_COUNT++))
    return 1
  else
    echo -e "    ${GREEN}✓ PASS: Content does not contain \"$unexpected\"${NC}"
    ((SUCCESS_COUNT++))
    return 0
  fi
}

# Test homepage 
test_homepage() {
  local domain=$1
  local slug_and_name=$2
  local slug=$(echo $slug_and_name | cut -d'|' -f1)
  local site_name=$(echo $slug_and_name | cut -d'|' -f2)
  
  echo -e "${MAGENTA}==== Testing Homepage for ${domain} ====${NC}"

  # Download homepage
  local output_file="${TEMP_DIR}/${domain}_homepage.html"
  curl -s -H "Host: ${domain}" "http://localhost:${PORT}" > "$output_file"
  
  if [ ! -s "$output_file" ]; then
    echo -e "  ${RED}✗ FAIL: Could not fetch homepage${NC}"
    ((FAIL_COUNT++))
    return 1
  fi
  
  # Read the file content
  local content=$(cat "$output_file")

  # Test 1: Site name should be in the title
  test_contains "$content" "$site_name" "Site name in homepage"
  
  # Test 2: Categories heading should be present
  test_contains "$content" "Categories" "Categories heading"
  
  # Test 3: Admin link should be present
  test_contains "$content" "Admin Dashboard" "Admin dashboard link"
  
  # Test 4: Should not contain other site names
  for other_domain in "${!SITE_DATA[@]}"; do
    if [ "$other_domain" != "$domain" ]; then
      local other_name=$(echo ${SITE_DATA[$other_domain]} | cut -d'|' -f2)
      if [ "$other_name" != "$site_name" ]; then
        test_not_contains "$content" "$other_name" "No content from $other_domain"
      fi
    fi
  done
  
  echo ""
}

# Test category page
test_category_page() {
  local domain=$1
  local slug_and_name=$2
  local slug=$(echo $slug_and_name | cut -d'|' -f1)
  local site_name=$(echo $slug_and_name | cut -d'|' -f2)
  local category=$3
  
  echo -e "${MAGENTA}==== Testing Category Page ${category} for ${domain} ====${NC}"

  # Download category page
  local output_file="${TEMP_DIR}/${domain}_${category}.html"
  curl -s -H "Host: ${domain}" "http://localhost:${PORT}/${category}" > "$output_file"
  
  if [ ! -s "$output_file" ]; then
    echo -e "  ${RED}✗ FAIL: Could not fetch category page${NC}"
    ((FAIL_COUNT++))
    return 1
  fi
  
  # Read the file content
  local content=$(cat "$output_file")

  # Test 1: Site name should be present
  test_contains "$content" "$site_name" "Site name in category page"
  
  # Test 2: Category name should be capitalized in the content
  local capitalized_category=$(echo "$category" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')
  test_contains "$content" "$capitalized_category" "Category name in content"
  
  # Test 3: Listings should be present or "No listings" message
  test_contains "$content" "listing\|No listings" "Listings or no listings message"
  
  # Test 4: Should not contain other site names
  for other_domain in "${!SITE_DATA[@]}"; do
    if [ "$other_domain" != "$domain" ]; then
      local other_name=$(echo ${SITE_DATA[$other_domain]} | cut -d'|' -f2)
      if [ "$other_name" != "$site_name" ]; then
        test_not_contains "$content" "$other_name" "No content from $other_domain"
      fi
    fi
  done
  
  echo ""
}

# Test listing page
test_listing_page() {
  local domain=$1
  local slug_and_name=$2
  local slug=$(echo $slug_and_name | cut -d'|' -f1)
  local site_name=$(echo $slug_and_name | cut -d'|' -f2)
  local category=$3
  local listing=$4
  
  echo -e "${MAGENTA}==== Testing Listing Page ${listing} for ${domain} ====${NC}"

  # Download listing page
  local output_file="${TEMP_DIR}/${domain}_${category}_${listing}.html"
  curl -s -H "Host: ${domain}" "http://localhost:${PORT}/${category}/${listing}" > "$output_file"
  
  if [ ! -s "$output_file" ]; then
    echo -e "  ${RED}✗ FAIL: Could not fetch listing page ${category}/${listing}${NC}"
    ((FAIL_COUNT++))
    return 1
  fi
  
  # Read the file content
  local content=$(cat "$output_file")

  # Test 1: Site name should be present
  test_contains "$content" "$site_name" "Site name in listing page"
  
  # Test 2: Listing name should be in the content (capitalized)
  local capitalized_listing=$(echo "$listing" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')
  test_contains "$content" "$capitalized_listing" "Listing name in content"
  
  # Test 3: Product details should be present
  test_contains "$content" "description\|features\|review\|rating" "Product details"
  
  # Test 4: Backlink should be present
  test_contains "$content" "href=\"http" "Backlink"
  
  # Test 5: Should not contain other site names
  for other_domain in "${!SITE_DATA[@]}"; do
    if [ "$other_domain" != "$domain" ]; then
      local other_name=$(echo ${SITE_DATA[$other_domain]} | cut -d'|' -f2)
      if [ "$other_name" != "$site_name" ]; then
        test_not_contains "$content" "$other_name" "No content from $other_domain"
      fi
    fi
  done
  
  echo ""
}

# Test API routes
test_api() {
  local domain=$1
  local slug_and_name=$2
  local slug=$(echo $slug_and_name | cut -d'|' -f1)
  local site_name=$(echo $slug_and_name | cut -d'|' -f2)
  local endpoint=$3
  
  echo -e "${MAGENTA}==== Testing API Endpoint ${endpoint} for ${domain} ====${NC}"

  # Download API response
  local output_file="${TEMP_DIR}/${domain}_api_${endpoint//\//_}.json"
  curl -s -H "Host: ${domain}" "http://localhost:${PORT}/api/${endpoint}" > "$output_file"
  
  if [ ! -s "$output_file" ]; then
    echo -e "  ${RED}✗ FAIL: Could not fetch API endpoint${NC}"
    ((FAIL_COUNT++))
    return 1
  fi
  
  # Read the file content
  local content=$(cat "$output_file")

  # Test 1: Response should be valid JSON
  if jq -e . >/dev/null 2>&1 <<<"$content"; then
    echo -e "  ${GREEN}✓ PASS: API returned valid JSON${NC}"
    ((SUCCESS_COUNT++))
  else
    echo -e "  ${RED}✗ FAIL: API did not return valid JSON${NC}"
    echo -e "  Response: ${content}"
    ((FAIL_COUNT++))
  fi
  
  # Test 2: For site-info, should contain correct site slug
  if [ "$endpoint" == "site-info" ]; then
    if echo "$content" | grep -q "\"slug\":\"$slug\""; then
      echo -e "  ${GREEN}✓ PASS: API returned correct site slug${NC}"
      ((SUCCESS_COUNT++))
    else
      echo -e "  ${RED}✗ FAIL: API did not return correct site slug${NC}"
      echo -e "  Response: ${content}"
      ((FAIL_COUNT++))
    fi
  fi
  
  # Test 3: Other endpoint-specific tests
  case "$endpoint" in
    "healthcheck")
      test_contains "$content" "status.*ok" "Healthcheck status"
      ;;
    "search")
      test_contains "$content" "results" "Search results field"
      ;;
    "sites")
      test_contains "$content" "\"sites\"" "Sites list"
      ;;
    *)
      # Generic success check
      test_not_contains "$content" "error" "No error in response"
      ;;
  esac
  
  echo ""
}

# Run test functions for each domain
for domain in "${!SITE_DATA[@]}"; do
  echo -e "${YELLOW}=================================================${NC}"
  echo -e "${YELLOW} Testing domain: ${domain}${NC}"
  echo -e "${YELLOW}=================================================${NC}"
  echo ""
  
  # Test homepage
  test_homepage "$domain" "${SITE_DATA[$domain]}"
  
  # Get site slug
  slug=$(echo ${SITE_DATA[$domain]} | cut -d'|' -f1)
  
  # Test common categories
  for category in "fly-fishing" "hiking-boots" "fishing-rods"; do
    test_category_page "$domain" "${SITE_DATA[$domain]}" "$category"
  done
  
  # Test sample listings
  test_listing_page "$domain" "${SITE_DATA[$domain]}" "fly-fishing" "premium-fly-rod"
  test_listing_page "$domain" "${SITE_DATA[$domain]}" "hiking-boots" "trail-master-boots"
  
  # Test API endpoints
  test_api "$domain" "${SITE_DATA[$domain]}" "site-info"
  test_api "$domain" "${SITE_DATA[$domain]}" "healthcheck"
  test_api "$domain" "${SITE_DATA[$domain]}" "search?q=fishing"
  
  echo ""
done

# Test admin page (independent of domain)
echo -e "${MAGENTA}==== Testing Admin Dashboard ====${NC}"
admin_content=$(curl -s "http://localhost:${PORT}/admin")

if [ -z "$admin_content" ]; then
  echo -e "  ${RED}✗ FAIL: Could not fetch admin page${NC}"
  ((FAIL_COUNT++))
else
  test_contains "$admin_content" "Admin Dashboard" "Admin page title"
  test_contains "$admin_content" "Sites" "Sites section"
  test_contains "$admin_content" "Add New Site" "Add site button"
fi

echo ""

# SUMMARY
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}                Test Summary                   ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Total tests run: ${TEST_COUNT}"
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