#!/usr/bin/env python3
"""
DirectoryMonster Listing Generator

This script generates listing data for the DirectoryMonster application
using the OpenAI API to create structured data based on search terms.
"""

import os
import json
import argparse
import logging
import requests
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
OUTPUT_DIR = './generated_listings'

def setup_directories():
    """Create output directories if they don't exist."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_with_openai(search_term, category, num_listings=3, model="gpt-4o"):
    """
    Use OpenAI to generate listing data.
    
    Args:
        search_term: What to search for
        category: The category name
        num_listings: Number of listings to generate
        model: OpenAI model to use
        
    Returns:
        Generated listing data
    """
    logger.info(f"Generating listings with OpenAI using model: {model}")
    
    # Check for API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    # Create the schema for listings
    target_schema = {
        "listings": [
            {
                "title": "Product title",
                "slug": "product-slug",
                "metaDescription": "SEO-friendly description of the product",
                "content": "Detailed content about the product (at least 300 words)",
                "imageUrl": "https://example.com/image.jpg",
                "backlinkUrl": "https://original-product-site.com/product",
                "backlinkAnchorText": "Product Name",
                "backlinkPosition": "prominent",
                "backlinkType": "dofollow",
                "customFields": {
                    "product_name": "Full product name",
                    "brand": "Brand name",
                    "rating": 4.5,
                    "category": "Product category",
                    "price": "Price with currency",
                    "weight": "Product weight",
                    "dimensions": "Product dimensions"
                }
            }
        ]
    }
    
    # Create the request to OpenAI
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a specialized content creation assistant for directory websites. You can create detailed, SEO-friendly product listings with accurate metadata."
            },
            {
                "role": "user",
                "content": f"""
                Create {num_listings} detailed product listings for a directory website about "{search_term}" in the category "{category}".
                
                For each listing:
                1. Create an informative title with the product name
                2. Generate a slug based on the title (lowercase, hyphens instead of spaces)
                3. Write a compelling meta description (150-160 characters)
                4. Write detailed content (at least 300 words) that includes:
                   - Product features and benefits
                   - Use cases and scenarios
                   - Technical specifications
                   - Comparisons to similar products
                   - Pros and cons
                5. Include realistic field values:
                   - A plausible image URL (can be fictional but follow realistic patterns)
                   - A backlink URL to a fictional or real retailer
                   - Appropriate backlink anchor text
                   - Custom fields with realistic values (rating, price, etc.)
                
                Format the output according to this JSON schema:
                ```json
                {json.dumps(target_schema, indent=2)}
                ```
                
                Ensure the content is informative, engaging and suitable for SEO. Use markdown formatting in the content field.
                Return ONLY the valid JSON output, no explanations or wrapper text.
                """
            }
        ],
        "temperature": 0.7
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            output_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Try to parse as JSON
            try:
                # Clean up the response - remove any markdown code blocks if present
                if "```json" in output_text:
                    output_text = output_text.split("```json")[1].split("```")[0].strip()
                elif "```" in output_text:
                    output_text = output_text.split("```")[1].split("```")[0].strip()
                
                formatted_data = json.loads(output_text)
                return formatted_data
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response as JSON: {e}")
                logger.error(f"Raw response: {output_text}")
                return {"error": "Failed to parse response as JSON", "raw_response": output_text}
        else:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            return {"error": f"OpenAI API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error communicating with OpenAI: {e}")
        return {"error": f"Error communicating with OpenAI: {str(e)}"}

def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description='DirectoryMonster Listing Generator',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Required arguments
    parser.add_argument('search_term', help='What to search for (e.g., "hiking backpacks")')
    parser.add_argument('category', help='Category name (e.g., "Backpacks")')
    
    # Optional arguments
    parser.add_argument('--num', type=int, default=3, help='Number of listings to generate')
    parser.add_argument('--model', default='gpt-4o', help='OpenAI model to use')
    parser.add_argument('--output-dir', help='Custom output directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Update output directory if specified
    global OUTPUT_DIR
    if args.output_dir:
        OUTPUT_DIR = args.output_dir
    
    # Set up directories
    setup_directories()
    
    try:
        # Generate listings
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{args.search_term.replace(' ', '_')}_{timestamp}.json"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        print(f"Generating {args.num} listings for '{args.search_term}' in category '{args.category}'...")
        
        # Generate the listings
        listings_data = generate_with_openai(
            search_term=args.search_term,
            category=args.category,
            num_listings=args.num,
            model=args.model
        )
        
        # Save the results
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(listings_data, f, indent=2)
        
        print(f"Listings generated and saved to: {output_path}")
        
        # Display a summary
        if "listings" in listings_data:
            listings = listings_data["listings"]
            print(f"\nGenerated {len(listings)} listings:")
            
            for i, listing in enumerate(listings):
                print(f"\n{i+1}. {listing.get('title', 'Untitled')}")
                print(f"   Slug: {listing.get('slug', 'none')}")
                print(f"   Meta Description: {listing.get('metaDescription', 'none')[:60]}...")
                content_preview = listing.get('content', '')[:100].replace('\n', ' ').strip()
                print(f"   Content Preview: {content_preview}...")
                if 'customFields' in listing:
                    cf = listing['customFields']
                    if 'price' in cf:
                        print(f"   Price: {cf['price']}")
                    if 'rating' in cf:
                        print(f"   Rating: {cf['rating']}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        logger.debug(traceback.format_exc())

if __name__ == "__main__":
    main()