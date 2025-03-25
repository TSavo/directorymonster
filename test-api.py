#!/usr/bin/env python3
import requests
import json

# API configuration
API_URL = "http://localhost:3000/api/listings"
API_KEY = "dev-api-key"
SITE_SLUG = "unique-products"
CATEGORY_ID = "category_1742883720947"  # Update this with the actual category ID

# Sample listing data
test_listing = {
    "siteSlug": SITE_SLUG,
    "categoryId": CATEGORY_ID,
    "title": "Vintage Collectible Test Item",
    "metaDescription": "This is a test listing to verify the API works correctly",
    "content": "# Test Listing\n\nThis is a detailed description of the test item. It's a rare collectible that you won't find anywhere else!",
    "imageUrl": "https://example.com/test-image.jpg",
    "backlinkUrl": "https://example.com/product/test",
    "backlinkAnchorText": "View the Test Item",
    "customFields": {
        "product_name": "Test Item",
        "brand": "Test Brand",
        "price": "$99.99",
        "category": "Test Category",
        "rating": 4.5
    }
}

# Make the API request
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

print(f"Submitting test listing to {API_URL}...")
response = requests.post(API_URL, headers=headers, json=test_listing)

# Print the result
if response.status_code == 201:
    print("Success! Listing created:")
    print(json.dumps(response.json(), indent=2))
else:
    print(f"Error: {response.status_code}")
    print(response.text)