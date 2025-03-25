#!/usr/bin/env python3
"""
Example script demonstrating how to use the enhanced extractor.py
to extract products from eBay, generate blog commentary,
and submit them to DirectoryMonster (or save locally).
"""

import os
import asyncio
from extractor import extract_and_format

async def main():
    # Check if OpenAI API key is set in environment
    if not os.environ.get('OPENAI_API_KEY'):
        print("WARNING: OPENAI_API_KEY environment variable is not set!")
        print("Please set it before running this script:")
        print("export OPENAI_API_KEY='your-api-key'")
        print("\nPress Enter to continue anyway (will likely fail) or Ctrl+C to cancel...")
        input()
    
    # Configure the extraction
    search_term = "vintage collectible dolls"
    
    # API config for DirectoryMonster
    api_config = {
        "base_url": "http://localhost:3000",
        "api_key": "dev-api-key",
        "site_slug": "unique-products",
        "category_name": "Collectibles",
        "mock_mode": False  # Set to False to use real API calls
        # If you have the category ID from create-site.js, use it here
        # "category_id": "category_1742883720947"
    }
    
    print(f"Extracting products for: {search_term}")
    print("This will:")
    print("1. Search for products on eBay")
    print("2. Extract product details")
    print("3. Generate fun blog commentary for each product")
    print("4. Submit products to DirectoryMonster API at http://localhost:3000")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    # Run the extraction
    formatted_data, raw_path, processed_path = await extract_and_format(
        search_term=search_term,
        source="ebay",
        max_products=3,
        llm_type="openai",
        model_name="gpt-3.5-turbo",
        gen_commentary=True,
        api_submit=True,
        api_config=api_config
    )
    
    # Show results
    print("\nExtraction complete!")
    print(f"Raw data: {raw_path}")
    print(f"Processed data: {processed_path}")
    
    # Show generated commentary
    if "products" in formatted_data:
        print("\nGenerated Products with Commentary:")
        for i, product in enumerate(formatted_data["products"]):
            print(f"\n{i+1}. {product.get('title', 'Unknown')}")
            print(f"   URL: {product.get('url', 'No URL')}")
            print(f"   Price: {product.get('price', 'No price')}")
            if "blog_commentary" in product:
                print(f"   Commentary: {product['blog_commentary']}")

if __name__ == "__main__":
    asyncio.run(main())