#!/usr/bin/env python3
"""
End-to-end integration test for DirectoryMonster.
This script tests the full user flow from homepage to category to product listing.
"""

import requests
from bs4 import BeautifulSoup
import time
import sys
import json
import os
from urllib.parse import urljoin

# Configuration
BASE_URL = "http://localhost:3000"  # Default for local testing
SITE_DOMAIN = "fishinggearreviews.com"  # Or any other site domain you're testing

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
ENDC = "\033[0m"


def print_header(message):
    """Print a formatted header message."""
    print(f"\n{BLUE}{'=' * 80}{ENDC}")
    print(f"{BLUE}== {message}{ENDC}")
    print(f"{BLUE}{'=' * 80}{ENDC}\n")


def print_success(message):
    """Print a success message."""
    print(f"{GREEN}✓ {message}{ENDC}")


def print_error(message):
    """Print an error message."""
    print(f"{RED}✗ ERROR: {message}{ENDC}")


def print_warning(message):
    """Print a warning message."""
    print(f"{YELLOW}! {message}{ENDC}")


def print_info(message):
    """Print an info message."""
    print(f"  {message}")


class DirectoryMonsterE2ETest:
    def __init__(self, base_url=BASE_URL, site_domain=SITE_DOMAIN):
        self.base_url = base_url
        self.site_domain = site_domain
        self.session = requests.Session()
        # Add a default timeout to all requests with a longer timeout
        self.session.request = lambda method, url, **kwargs: requests.Session.request(
            self.session, method, url, timeout=30, **kwargs
        )
        # Track visited URLs for debugging
        self.visited_urls = []
        # Create a results log
        self.results = {
            "success": True,
            "homepage": False,
            "category_page": False,
            "listing_page": False,
            "errors": [],
            "category_url": None,
            "listing_url": None,
        }

    def log_error(self, message):
        """Log an error and mark the test as failed."""
        print_error(message)
        self.results["success"] = False
        self.results["errors"].append(message)

    def request_page(self, url, params=None, description="page"):
        """Make a request and return the response with error handling."""
        try:
            full_url = urljoin(self.base_url, url) if not url.startswith("http") else url
            self.visited_urls.append(full_url)
            
            if params:
                print_info(f"Requesting {description}: {full_url} with params {params}")
                response = self.session.get(full_url, params=params)
            else:
                print_info(f"Requesting {description}: {full_url}")
                response = self.session.get(full_url)
            
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            self.log_error(f"Failed to fetch {description}: {e}")
            return None

    def test_homepage(self):
        """Test the homepage renders correctly and has category links."""
        print_header("TESTING HOMEPAGE")
        
        # Use the hostname parameter to ensure we get the right site
        params = {"hostname": self.site_domain}
        response = self.request_page("/", params, "homepage")
        
        if not response:
            return None, None
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Check for the site name in the HTML
        site_title_element = soup.select_one("h1")
        if not site_title_element:
            self.log_error("No site title (h1) found on homepage")
            return None, None
        
        site_title = site_title_element.text.strip()
        print_info(f"Found site title: {site_title}")
        
        # Find category links
        category_links = soup.select("a[href^='/']")
        
        valid_category_links = []
        for link in category_links:
            href = link.get("href", "")
            # Skip admin links and other non-category links
            if href == "/admin" or href == "/" or not href.startswith("/"):
                continue
            
            # Found a potential category link
            valid_category_links.append({
                "url": href,
                "text": link.text.strip()
            })
        
        if not valid_category_links:
            self.log_error("No category links found on homepage")
            return None, None
        
        print_success(f"Found {len(valid_category_links)} category links")
        for i, link in enumerate(valid_category_links[:3]):  # Show first few links
            print_info(f"  - {link['text']} -> {link['url']}")
        
        if len(valid_category_links) > 3:
            print_info(f"  - (and {len(valid_category_links) - 3} more...)")
        
        # Mark homepage test as successful
        self.results["homepage"] = True
        
        # Return the soup and found links for later use
        return soup, valid_category_links

    def test_category_page(self, category_links):
        """Test a category page renders correctly and has listing links."""
        print_header("TESTING CATEGORY PAGE")
        
        if not category_links:
            self.log_error("No category links to test")
            return None, None
        
        # Choose the first category link
        category = category_links[0]
        print_info(f"Selected category: {category['text']} ({category['url']})")
        
        # Remember the category URL for logging
        self.results["category_url"] = urljoin(self.base_url, category['url'])
        
        # Use the hostname parameter to ensure we get the right site
        params = {"hostname": self.site_domain}
        response = self.request_page(category['url'], params, f"category page '{category['text']}'")
        
        if not response:
            return None, None
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Verify we're on a category page by checking for the category title
        category_title_element = soup.select_one("h1")
        if not category_title_element:
            self.log_error("No category title (h1) found on category page")
            return None, None
        
        category_title = category_title_element.text.strip()
        if category_title.lower() != category['text'].lower() and not category['text'] in category_title:
            print_warning(f"Category title mismatch: expected '{category['text']}', got '{category_title}'")
        else:
            print_success(f"Found category title: {category_title}")
        
        # Look for listing links - normally inside ListingCard components
        # Target links that go to individual listings, which should have URLs like /{category}/slug
        listing_links = []
        
        # First attempt: look for View Details links
        view_details_links = soup.select("a:contains('View Details')")
        if view_details_links:
            listing_links.extend([{"url": link["href"], "text": "View Details"} for link in view_details_links if "href" in link.attrs])
        
        # Second attempt: more generic approach - look for links that might be listings
        if not listing_links:
            all_links = soup.select("a")
            category_slug = category['url'].strip("/")
            for link in all_links:
                href = link.get("href", "")
                # Look for links matching the pattern /{category-slug}/{listing-slug}
                if href.startswith(f"/{category_slug}/") and href != category['url']:
                    # Find the closest heading which might have the title
                    title_elem = link.find_previous("h2") or link.find_previous("h3")
                    title = title_elem.text.strip() if title_elem else "Unknown listing"
                    listing_links.append({
                        "url": href,
                        "text": title
                    })
        
        # Third attempt: check for direct product heading links
        if not listing_links:
            product_headings = soup.select("h2 a, h3 a")
            for link in product_headings:
                href = link.get("href", "")
                if href and href.startswith("/") and href != "/" and href != category['url']:
                    listing_links.append({
                        "url": href,
                        "text": link.text.strip()
                    })
        
        # Remove duplicates
        unique_links = []
        seen_urls = set()
        for link in listing_links:
            if link["url"] not in seen_urls:
                seen_urls.add(link["url"])
                unique_links.append(link)
        
        listing_links = unique_links
        
        if not listing_links:
            self.log_error(f"No listing links found on category page {category['url']}")
            # Let's print out all links we found to help debug
            print_warning("All links found on the page:")
            all_links = soup.select("a")
            for link in all_links:
                print_info(f"  - {link.text.strip()} -> {link.get('href', 'no-href')}")
            return None, None
        
        print_success(f"Found {len(listing_links)} listing links")
        for i, link in enumerate(listing_links[:3]):  # Show first few links
            print_info(f"  - {link['text']} -> {link['url']}")
        
        if len(listing_links) > 3:
            print_info(f"  - (and {len(listing_links) - 3} more...)")
        
        # Mark category page test as successful
        self.results["category_page"] = True
        
        # Return the soup and found links for later use
        return soup, listing_links

    def test_listing_page(self, listing_links):
        """Test a listing page renders correctly."""
        print_header("TESTING LISTING PAGE")
        
        if not listing_links:
            self.log_error("No listing links to test")
            return None
        
        # Choose the first listing link
        listing = listing_links[0]
        print_info(f"Selected listing: {listing['url']}")
        
        # Remember the listing URL for logging
        self.results["listing_url"] = urljoin(self.base_url, listing['url'])
        
        # Use the hostname parameter to ensure we get the right site
        params = {"hostname": self.site_domain}
        response = self.request_page(listing['url'], params, f"listing page {listing['url']}")
        
        if not response:
            return None
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Verify we're on a listing page by checking for the listing title
        listing_title_element = soup.select_one("h1")
        if not listing_title_element:
            self.log_error("No listing title (h1) found on listing page")
            return None
        
        listing_title = listing_title_element.text.strip()
        print_success(f"Found listing title: {listing_title}")
        
        # Check for key listing page elements
        breadcrumbs = soup.select("nav[aria-label='Breadcrumb']")
        if not breadcrumbs:
            print_warning("No breadcrumb navigation found on listing page")
        else:
            print_success("Found breadcrumb navigation")
        
        # Look for backlink elements which should exist on all listing pages
        backlinks = soup.select("a[href^='http']")
        backlink_count = len([link for link in backlinks if not link["href"].startswith(self.base_url)])
        
        if backlink_count == 0:
            print_warning("No external backlinks found on listing page")
        else:
            print_success(f"Found {backlink_count} external backlinks")
        
        # Look for structured data (important for SEO)
        structured_data = soup.select("script[type='application/ld+json']")
        if not structured_data:
            print_warning("No structured data found on listing page")
        else:
            print_success(f"Found {len(structured_data)} structured data blocks")
        
        # Mark listing page test as successful
        self.results["listing_page"] = True
        
        return soup

    def run_all_tests(self):
        """Run the full test suite."""
        start_time = time.time()
        
        try:
            # Step 1: Test the homepage
            homepage_soup, category_links = self.test_homepage()
            if not homepage_soup or not category_links:
                self.log_error("Homepage test failed, cannot continue")
                return self.results
            
            # Step 2: Test a category page
            category_soup, listing_links = self.test_category_page(category_links)
            if not category_soup or not listing_links:
                self.log_error("Category page test failed, cannot continue")
                return self.results
            
            # Step 3: Test a listing page
            listing_soup = self.test_listing_page(listing_links)
            if not listing_soup:
                self.log_error("Listing page test failed")
                return self.results
            
            # All tests completed successfully
            print_header("ALL TESTS COMPLETED")
            print_success("Homepage test: PASSED")
            print_success("Category page test: PASSED")
            print_success("Listing page test: PASSED")
            
        except Exception as e:
            self.log_error(f"Unexpected error during tests: {e}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print_header(f"TEST SUMMARY (completed in {duration:.2f} seconds)")
        if self.results["success"]:
            print_success("All tests PASSED!")
        else:
            print_error(f"Tests FAILED with {len(self.results['errors'])} errors")
            for i, error in enumerate(self.results["errors"]):
                print_error(f"  {i+1}. {error}")
        
        print_info("Visited URLs:")
        for url in self.visited_urls:
            print_info(f"  - {url}")
        
        return self.results


if __name__ == "__main__":
    # Allow command line args to override defaults
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
    if len(sys.argv) > 2:
        SITE_DOMAIN = sys.argv[2]
    
    print_header(f"DIRECTORY MONSTER E2E FLOW TEST")
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"Testing site: {SITE_DOMAIN}")
    
    # Run the tests
    tester = DirectoryMonsterE2ETest(BASE_URL, SITE_DOMAIN)
    results = tester.run_all_tests()
    
    # Exit with appropriate status code
    sys.exit(0 if results["success"] else 1)