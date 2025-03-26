#!/usr/bin/env python3
"""
AI-Enhanced SEO Extractor

Uses Browser Use to extract raw product data and then leverages a local LLM
(like Ollama/Llama) to process and format the results into structured JSON.
"""

import os
import json
import time
import argparse
import asyncio
import logging
import requests
from datetime import datetime
from typing import Dict, List, Any, Union, Optional

# Browser Use imports
from browser_use import Agent
from langchain_openai import ChatOpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
OUTPUT_DIR = './seo_data'
LOGS_DIR = os.path.join(OUTPUT_DIR, 'logs')
SCREENSHOTS_DIR = os.path.join(OUTPUT_DIR, 'screenshots')
RAW_DIR = os.path.join(OUTPUT_DIR, 'raw')
PROCESSED_DIR = os.path.join(OUTPUT_DIR, 'processed')

# Default formatting model config
DEFAULT_LLM_TYPE = "ollama"  # Options: ollama, openai, anthropic
DEFAULT_LLM_MODEL = "llama3"  # For Ollama
DEFAULT_OPENAI_MODEL = "gpt-3.5-turbo"
DEFAULT_ANTHROPIC_MODEL = "claude-3-haiku-20240307"

async def run_browser_use_extraction(search_term, source="google", site=None, max_products=5, custom_instructions=None):
    """
    Run the Browser Use agent to extract SEO data.
    
    Args:
        search_term: What to search for
        source: Where to search (google, amazon, etc.)
        site: Specific site to search within
        max_products: Number of products to find
        custom_instructions: Any additional instructions
        
    Returns:
        The raw extraction results and output path
    """
    # Check for API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    # Create output directories
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(LOGS_DIR, exist_ok=True)
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    
    # Run ID for this extraction
    run_id = f"{search_term.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Build the search query
    site_query = f" site:{site}" if site and source.lower() == "google" else ""
    
    # Define search sources
    search_instructions = {
        "google": f"Go to Google and search for '{search_term}{site_query}'",
        "amazon": f"Go to Amazon and search for '{search_term}'",
        "ebay": f"Go to eBay and search for '{search_term}'",
        "walmart": f"Go to Walmart's website and search for '{search_term}'",
        "bestbuy": f"Go to Best Buy's website and search for '{search_term}'",
    }
    
    # Get the base search instruction
    base_instruction = search_instructions.get(
        source.lower(), 
        f"Go to {source} and search for '{search_term}'"
    )
    
    # Build the task description
    task = (
        f"{base_instruction}\n\n"
        f"Find {max_products} different product pages. For each product:\n"
        f"1. Click on the product link to visit its detailed product page\n"
        f"2. Extract all available SEO data including:\n"
        f"   - Complete product URL (absolute, not relative)\n"
        f"   - Product title/name\n"
        f"   - Description\n"
        f"   - Price\n"
        f"   - All available product images (main image and additional images)\n"
        f"   - Brand/manufacturer\n"
        f"   - Product specifications\n"
        f"   - Any schema.org or structured data available\n"
        f"   - Meta tags, Open Graph tags, Twitter cards\n"
        f"3. Go back to search results to find the next product\n\n"
        f"Focus on URLs and comprehensive SEO data. Format results as a JSON array of products."
    )
    
    # Add custom instructions if provided
    if custom_instructions:
        task += f"\n\nAdditional instructions: {custom_instructions}"
    
    logger.info(f"Starting Browser Use extraction for: {search_term}")
    
    # Initialize the LLM
    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=api_key
    )
    
    # Create and run the agent
    agent = Agent(
        task=task,
        llm=llm,
        save_conversation_path=os.path.join(LOGS_DIR, f"{run_id}_conversation.json"),
        generate_gif=os.path.join(SCREENSHOTS_DIR, f"{run_id}.gif") # Enable headless mode for environments without display
    )
    
    # Run the agent and get history
    history = await agent.run(max_steps=max_products * 10)
    
    # Get the raw extraction results
    raw_results = history.final_result()
    
    # Save the raw results
    raw_output_path = os.path.join(RAW_DIR, f"{run_id}_raw_results.json")
    
    with open(raw_output_path, 'w', encoding='utf-8') as f:
        # Try to save as JSON if possible, otherwise save as string
        try:
            if isinstance(raw_results, str):
                # Check if it's JSON in a code block
                if "```json" in raw_results:
                    json_str = raw_results.split("```json")[1].split("```")[0].strip()
                    data = json.loads(json_str)
                    json.dump(data, f, indent=2)
                else:
                    # Try parsing as JSON directly
                    try:
                        data = json.loads(raw_results)
                        json.dump(data, f, indent=2)
                    except:
                        # Just save as string
                        f.write(raw_results)
            else:
                # Should be JSON serializable
                json.dump(raw_results, f, indent=2)
        except:
            # Fallback: save as string
            if isinstance(raw_results, str):
                f.write(raw_results)
            else:
                f.write(str(raw_results))
    
    logger.info(f"Browser Use extraction complete. Raw results saved to: {raw_output_path}")
    
    # Also save any screenshots
    screenshots = history.screenshots()
    if screenshots:
        latest_screenshot = screenshots[-1]
        if os.path.exists(latest_screenshot):
            import shutil
            screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{run_id}_final.png")
            shutil.copy(latest_screenshot, screenshot_path)
    
    return raw_results, raw_output_path, run_id

def format_with_ollama(raw_data, model_name="llama3", target_schema=None):
    """
    Use Ollama to format the raw extraction results into structured JSON.
    
    Args:
        raw_data: Raw extraction results
        model_name: Ollama model to use
        target_schema: Optional schema description for output structure
        
    Returns:
        Formatted JSON data
    """
    logger.info(f"Formatting with Ollama using model: {model_name}")
    
    # Convert raw_data to string if it's not already
    if not isinstance(raw_data, str):
        raw_input = json.dumps(raw_data)
    else:
        raw_input = raw_data
    
    # Create the default schema if none provided
    if not target_schema:
        target_schema = """
        {
            "products": [
                {
                    "id": "unique_id",
                    "url": "https://example.com/product/123",
                    "title": "Product title",
                    "description": "Product description",
                    "price": "Price with currency",
                    "brand": "Brand name",
                    "category": "Product category",
                    "images": {
                        "main": "Main image URL",
                        "thumbnail": "Thumbnail URL",
                        "additional": ["URL1", "URL2"]
                    },
                    "specs": {
                        "key1": "value1",
                        "key2": "value2"
                    },
                    "seo_data": {
                        "meta_tags": {},
                        "og_tags": {},
                        "schema_data": {}
                    }
                }
            ]
        }
        """
    
    # Create the prompt for Ollama
    prompt = f"""
    I have raw data from a web scraping operation that extracted product information.
    I need you to format this data into a clean, consistent JSON structure.
    
    Here's the raw data:
    ```
    {raw_input}
    ```
    
    Please format this data according to the following JSON schema:
    ```json
    {target_schema}
    ```
    
    Important notes:
    1. Make sure all URLs are absolute, not relative
    2. Only include fields that have data; omit empty fields
    3. Ensure the output is valid JSON
    4. If there's structured data like schema.org JSON-LD, try to preserve it
    5. Return ONLY the formatted JSON, no explanations, no markdown
    
    Output:
    """
    
    # Send request to Ollama API
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            formatted_text = result.get("response", "")
            
            # Try to parse as JSON
            try:
                # Clean up the response - remove any markdown code blocks if present
                if "```json" in formatted_text:
                    formatted_text = formatted_text.split("```json")[1].split("```")[0].strip()
                elif "```" in formatted_text:
                    formatted_text = formatted_text.split("```")[1].split("```")[0].strip()
                
                formatted_data = json.loads(formatted_text)
                return formatted_data
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Ollama response as JSON: {e}")
                return {"error": "Failed to parse response as JSON", "raw_response": formatted_text}
        else:
            logger.error(f"Ollama API error: {response.status_code} - {response.text}")
            return {"error": f"Ollama API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error communicating with Ollama: {e}")
        return {"error": f"Error communicating with Ollama: {str(e)}"}

def format_with_openai(raw_data, model_name="gpt-3.5-turbo", target_schema=None):
    """
    Use OpenAI to format the raw extraction results into structured JSON.
    
    Args:
        raw_data: Raw extraction results
        model_name: OpenAI model to use
        target_schema: Optional schema description for output structure
        
    Returns:
        Formatted JSON data
    """
    logger.info(f"Formatting with OpenAI using model: {model_name}")
    
    # Check for API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    # Convert raw_data to string if it's not already
    if not isinstance(raw_data, str):
        raw_input = json.dumps(raw_data)
    else:
        raw_input = raw_data
    
    # Create the default schema if none provided
    if not target_schema:
        target_schema = """
        {
            "products": [
                {
                    "id": "unique_id",
                    "url": "https://example.com/product/123",
                    "title": "Product title",
                    "description": "Product description",
                    "price": "Price with currency",
                    "brand": "Brand name",
                    "category": "Product category",
                    "images": {
                        "main": "Main image URL",
                        "thumbnail": "Thumbnail URL",
                        "additional": ["URL1", "URL2"]
                    },
                    "specs": {
                        "key1": "value1",
                        "key2": "value2"
                    },
                    "seo_data": {
                        "meta_tags": {},
                        "og_tags": {},
                        "schema_data": {}
                    }
                }
            ]
        }
        """
    
    # Create the request to OpenAI
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "system",
                "content": "You are a data formatting assistant. Format the provided raw data into the specified JSON structure without explanations."
            },
            {
                "role": "user",
                "content": f"""
                I have raw data from a web scraping operation that extracted product information.
                I need you to format this data into a clean, consistent JSON structure.
                
                Here's the raw data:
                ```
                {raw_input}
                ```
                
                Please format this data according to the following JSON schema:
                ```json
                {target_schema}
                ```
                
                Important notes:
                1. Make sure all URLs are absolute, not relative
                2. Only include fields that have data; omit empty fields
                3. Ensure the output is valid JSON
                4. If there's structured data like schema.org JSON-LD, try to preserve it
                5. Return ONLY the formatted JSON, no explanations, no markdown
                """
            }
        ],
        "temperature": 0.2
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            formatted_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Try to parse as JSON
            try:
                # Clean up the response - remove any markdown code blocks if present
                if "```json" in formatted_text:
                    formatted_text = formatted_text.split("```json")[1].split("```")[0].strip()
                elif "```" in formatted_text:
                    formatted_text = formatted_text.split("```")[1].split("```")[0].strip()
                
                formatted_data = json.loads(formatted_text)
                return formatted_data
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response as JSON: {e}")
                return {"error": "Failed to parse response as JSON", "raw_response": formatted_text}
        else:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            return {"error": f"OpenAI API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error communicating with OpenAI: {e}")
        return {"error": f"Error communicating with OpenAI: {str(e)}"}

def format_with_anthropic(raw_data, model_name="claude-3-haiku-20240307", target_schema=None):
    """
    Use Anthropic Claude to format the raw extraction results into structured JSON.
    
    Args:
        raw_data: Raw extraction results
        model_name: Claude model to use
        target_schema: Optional schema description for output structure
        
    Returns:
        Formatted JSON data
    """
    logger.info(f"Formatting with Anthropic using model: {model_name}")
    
    # Check for API key
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
    
    # Convert raw_data to string if it's not already
    if not isinstance(raw_data, str):
        raw_input = json.dumps(raw_data)
    else:
        raw_input = raw_data
    
    # Create the default schema if none provided
    if not target_schema:
        target_schema = """
        {
            "products": [
                {
                    "id": "unique_id",
                    "url": "https://example.com/product/123",
                    "title": "Product title",
                    "description": "Product description",
                    "price": "Price with currency",
                    "brand": "Brand name",
                    "category": "Product category",
                    "images": {
                        "main": "Main image URL",
                        "thumbnail": "Thumbnail URL",
                        "additional": ["URL1", "URL2"]
                    },
                    "specs": {
                        "key1": "value1",
                        "key2": "value2"
                    },
                    "seo_data": {
                        "meta_tags": {},
                        "og_tags": {},
                        "schema_data": {}
                    }
                }
            ]
        }
        """
    
    # Create the request to Anthropic
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    }
    
    payload = {
        "model": model_name,
        "max_tokens": 4000,
        "temperature": 0.2,
        "system": "You are a data formatting assistant. Format the provided raw data into the specified JSON structure without explanations.",
        "messages": [
            {
                "role": "user",
                "content": f"""
                I have raw data from a web scraping operation that extracted product information.
                I need you to format this data into a clean, consistent JSON structure.
                
                Here's the raw data:
                ```
                {raw_input}
                ```
                
                Please format this data according to the following JSON schema:
                ```json
                {target_schema}
                ```
                
                Important notes:
                1. Make sure all URLs are absolute, not relative
                2. Only include fields that have data; omit empty fields
                3. Ensure the output is valid JSON
                4. If there's structured data like schema.org JSON-LD, try to preserve it
                5. Return ONLY the formatted JSON, no explanations, no markdown
                """
            }
        ]
    }
    
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            formatted_text = result.get("content", [{}])[0].get("text", "")
            
            # Try to parse as JSON
            try:
                # Clean up the response - remove any markdown code blocks if present
                if "```json" in formatted_text:
                    formatted_text = formatted_text.split("```json")[1].split("```")[0].strip()
                elif "```" in formatted_text:
                    formatted_text = formatted_text.split("```")[1].split("```")[0].strip()
                
                formatted_data = json.loads(formatted_text)
                return formatted_data
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Claude response as JSON: {e}")
                return {"error": "Failed to parse response as JSON", "raw_response": formatted_text}
        else:
            logger.error(f"Anthropic API error: {response.status_code} - {response.text}")
            return {"error": f"Anthropic API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error communicating with Anthropic: {e}")
        return {"error": f"Error communicating with Anthropic: {str(e)}"}

def generate_blog_commentary(product_data, model="gpt-3.5-turbo"):
    """
    Generate engaging blog commentary for the product using OpenAI.
    
    Args:
        product_data: Product data to generate commentary for
        model: OpenAI model to use
        
    Returns:
        A string containing the blog commentary
    """
    logger.info(f"Generating blog commentary with OpenAI using model: {model}")
    
    # Check for API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    # Convert product_data to string if it's not already
    if not isinstance(product_data, str):
        product_input = json.dumps(product_data)
    else:
        product_input = product_data
    
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
                "content": "You are an enthusiastic, slightly quirky blog writer. Your task is to create short, engaging commentary for product listings that will catch a reader's attention and encourage them to explore the product further. Your tone should be conversational, fun, and sometimes a bit surprised by what you're seeing. Keep it short and impactful."
            },
            {
                "role": "user",
                "content": f"""
                Here's product data for an item I found on the web:
                ```
                {product_input}
                ```
                
                Write a short, catchy blog commentary for this product. Something like:
                "Check out this amazing gadget I found! It's perfect for anyone who needs X."
                or
                "I couldn't believe the price on this - such a steal for the quality you're getting!"
                
                Keep it under 2-3 sentences, make it sound casual and excited, like a friend sharing a cool find.
                """
            }
        ],
        "temperature": 0.8,
        "max_tokens": 150
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            commentary = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            return commentary.strip()
        else:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            return ""
    except Exception as e:
        logger.error(f"Error communicating with OpenAI: {e}")
        return ""

class DirectoryMonsterClient:
    """Client for interacting with the DirectoryMonster API."""
    
    def __init__(self, base_url, api_key, output_path=None, mock_mode=False):
        """
        Initialize the DirectoryMonster API client.
        
        Args:
            base_url: Base URL of the DirectoryMonster API
            api_key: API key for authentication
            output_path: Path to save products locally if API is not accessible
            mock_mode: Whether to operate in mock mode (no actual API calls)
        """
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        self.output_path = output_path or "directorymonster_products.json"
        self.mock_mode = mock_mode
        
        if self.mock_mode:
            logger.info(f"DirectoryMonster Client initialized in mock mode. Products will be saved to {self.output_path}")
        else:
            logger.info(f"DirectoryMonster Client initialized with API at {self.base_url}")
    
    def create_site(self, site_data):
        """
        Create a new site.
        
        Args:
            site_data: Site data to create
            
        Returns:
            Created site data
        """
        if self.mock_mode:
            logger.info(f"Mock: Creating site {site_data.get('name', 'Unknown')}")
            return {"id": f"site_{int(time.time())}", **site_data}
        
        try:
            response = requests.post(
                f"{self.base_url}/api/sites",
                headers=self.headers,
                json=site_data
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error creating site: {e}")
            return {"id": f"site_{int(time.time())}", **site_data}
    
    def list_sites(self):
        """
        List all sites.
        
        Returns:
            List of sites
        """
        if self.mock_mode:
            logger.info("Mock: Listing sites")
            return []
        
        try:
            response = requests.get(
                f"{self.base_url}/api/sites",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error listing sites: {e}")
            return []
    
    def create_category(self, site_slug, category_data):
        """
        Create a new category within a site.
        
        Args:
            site_slug: Slug of the site to create the category in
            category_data: Category data to create
            
        Returns:
            Created category data
        """
        if self.mock_mode:
            logger.info(f"Mock: Creating category {category_data.get('name', 'Unknown')} in site {site_slug}")
            return {"id": f"category_{int(time.time())}", "siteSlug": site_slug, **category_data}
        
        try:
            response = requests.post(
                f"{self.base_url}/api/sites/{site_slug}/categories",
                headers=self.headers,
                json=category_data
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error creating category: {e}")
            return {"id": f"category_{int(time.time())}", "siteSlug": site_slug, **category_data}
    
    def list_categories(self, site_slug):
        """
        List all categories for a site.
        
        Args:
            site_slug: Slug of the site to list categories for
            
        Returns:
            List of categories
        """
        if self.mock_mode:
            logger.info(f"Mock: Listing categories for site {site_slug}")
            return []
        
        try:
            response = requests.get(
                f"{self.base_url}/api/sites/{site_slug}/categories",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error listing categories: {e}")
            return []
    
    def create_listing(self, site_slug, listing_data):
        """
        Create a new product listing.
        
        Args:
            site_slug: Slug of the site to create the listing in
            listing_data: Listing data to create
            
        Returns:
            Created listing data
        """
        if self.mock_mode:
            logger.info(f"Mock: Creating listing {listing_data.get('title', 'Unknown')} in site {site_slug}")
            listing = {
                "id": f"listing_{int(time.time())}_{hash(listing_data.get('title', ''))}",
                "siteSlug": site_slug, 
                **listing_data
            }
            
            # Save to local file
            try:
                existing_data = []
                if os.path.exists(self.output_path):
                    with open(self.output_path, 'r', encoding='utf-8') as f:
                        try:
                            existing_data = json.load(f)
                        except:
                            existing_data = []
                
                if not isinstance(existing_data, list):
                    existing_data = []
                
                existing_data.append(listing)
                
                with open(self.output_path, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, indent=2)
                
                logger.info(f"Saved listing to {self.output_path}")
            except Exception as e:
                logger.error(f"Error saving listing to file: {e}")
            
            return listing
        
        try:
            # Use the Pages Router style API endpoint
            api_data = {
                "siteSlug": site_slug,
                **listing_data
            }
            
            logger.info(f"Submitting product to API: {self.base_url}/api/listings")
            response = requests.post(
                f"{self.base_url}/api/listings",
                headers=self.headers,
                json=api_data
            )
            
            logger.info(f"API response status: {response.status_code}")
            
            if response.status_code >= 400:
                logger.error(f"API error: {response.text}")
                raise Exception(f"API error: {response.status_code}")
            
            return response.json()
        except Exception as e:
            logger.error(f"Error creating listing: {e}")
            # Fallback to file storage
            listing = {
                "id": f"listing_{int(time.time())}_{hash(listing_data.get('title', ''))}",
                "siteSlug": site_slug, 
                **listing_data
            }
            
            # Save to local file
            try:
                existing_data = []
                if os.path.exists(self.output_path):
                    with open(self.output_path, 'r', encoding='utf-8') as f:
                        try:
                            existing_data = json.load(f)
                        except:
                            existing_data = []
                
                if not isinstance(existing_data, list):
                    existing_data = []
                
                existing_data.append(listing)
                
                with open(self.output_path, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, indent=2)
                
                logger.info(f"Saved listing to {self.output_path}")
            except Exception as e:
                logger.error(f"Error saving listing to file: {e}")
            
            return listing
    
    def list_listings(self, site_slug):
        """
        List all listings for a site.
        
        Args:
            site_slug: Slug of the site to list listings for
            
        Returns:
            List of listings
        """
        if self.mock_mode:
            logger.info(f"Mock: Listing listings for site {site_slug}")
            # Read from local file
            try:
                if os.path.exists(self.output_path):
                    with open(self.output_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            return [d for d in data if d.get("siteSlug") == site_slug]
                        return []
                else:
                    return []
            except Exception as e:
                logger.error(f"Error reading listings from file: {e}")
                return []
        
        try:
            response = requests.get(
                f"{self.base_url}/api/sites/{site_slug}/listings",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error listing listings: {e}")
            # Fallback to file storage
            try:
                if os.path.exists(self.output_path):
                    with open(self.output_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            return [d for d in data if d.get("siteSlug") == site_slug]
                        return []
                else:
                    return []
            except Exception as e:
                logger.error(f"Error reading listings from file: {e}")
                return []

def format_with_ai(
    raw_data, 
    llm_type="ollama", 
    model_name=None,
    target_schema=None
):
    """
    Format raw data using the specified AI service.
    
    Args:
        raw_data: Raw extraction results
        llm_type: AI service to use (ollama, openai, anthropic)
        model_name: Model to use with the AI service
        target_schema: Optional schema description for output structure
        
    Returns:
        Formatted JSON data
    """
    # Use default models if none specified
    if not model_name:
        if llm_type == "ollama":
            model_name = DEFAULT_LLM_MODEL
        elif llm_type == "openai":
            model_name = DEFAULT_OPENAI_MODEL
        elif llm_type == "anthropic":
            model_name = DEFAULT_ANTHROPIC_MODEL
    
    # Format with the appropriate AI service
    if llm_type == "ollama":
        return format_with_ollama(raw_data, model_name, target_schema)
    elif llm_type == "openai":
        return format_with_openai(raw_data, model_name, target_schema)
    elif llm_type == "anthropic":
        return format_with_anthropic(raw_data, model_name, target_schema)
    else:
        raise ValueError(f"Unsupported LLM type: {llm_type}")

async def extract_and_format(
    search_term,
    source="google",
    site=None,
    max_products=5,
    custom_instructions=None,
    llm_type="ollama",
    model_name=None,
    schema_file=None,
    gen_commentary=True,
    api_submit=False,
    api_config=None
):
    """
    Main function to extract data with Browser Use and then format with an LLM.
    
    Args:
        search_term: What to search for
        source: Where to search (google, amazon, etc.)
        site: Specific site to search within
        max_products: Number of products to find
        custom_instructions: Any additional instructions for Browser Use
        llm_type: AI service to use for formatting (ollama, openai, anthropic)
        model_name: Model to use with the AI service
        schema_file: Path to a JSON file containing the target schema
        gen_commentary: Whether to generate blog commentary for products
        api_submit: Whether to submit products to the DirectoryMonster API
        api_config: Configuration for the DirectoryMonster API
        
    Returns:
        Formatted data and output paths
    """
    # Create output directories
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    # Run the Browser Use extraction
    raw_results, raw_path, run_id = await run_browser_use_extraction(
        search_term=search_term,
        source=source,
        site=site,
        max_products=max_products,
        custom_instructions=custom_instructions
    )
    
    # Load custom schema if provided
    target_schema = None
    if schema_file and os.path.exists(schema_file):
        with open(schema_file, 'r', encoding='utf-8') as f:
            target_schema = f.read()
    
    # Format the raw results with the specified AI service
    logger.info(f"Formatting extraction results with {llm_type}")
    formatted_data = format_with_ai(
        raw_data=raw_results,
        llm_type=llm_type,
        model_name=model_name,
        target_schema=target_schema
    )
    
    # Generate blog commentary if requested
    if gen_commentary and "products" in formatted_data:
        logger.info("Generating blog commentary for products")
        for product in formatted_data["products"]:
            try:
                commentary = generate_blog_commentary(product)
                if commentary:
                    product["blog_commentary"] = commentary
                    logger.info(f"Generated commentary for {product.get('title', 'Unknown Product')}")
            except Exception as e:
                logger.error(f"Error generating commentary: {e}")
    
    # Save the formatted results
    processed_path = os.path.join(PROCESSED_DIR, f"{run_id}_processed.json")
    with open(processed_path, 'w', encoding='utf-8') as f:
        json.dump(formatted_data, f, indent=2)
    
    logger.info(f"Formatted results saved to: {processed_path}")
    
    # Submit to DirectoryMonster API if requested
    if api_submit and api_config:
        try:
            logger.info("Submitting products to DirectoryMonster API")
            
            # Initialize API client
            client = DirectoryMonsterClient(
                base_url=api_config.get("base_url", "http://localhost:3000"),
                api_key=api_config.get("api_key", ""),
                mock_mode=api_config.get("mock_mode", True)
            )
            
            # Check if site exists, or create it
            site_slug = api_config.get("site_slug")
            if not site_slug:
                logger.warning("No site slug provided, skipping API submission")
            else:
                # Get or create category
                category_id = api_config.get("category_id")
                if not category_id and "category_name" in api_config:
                    # Try to find or create the category
                    try:
                        categories = client.list_categories(site_slug)
                        for cat in categories:
                            if cat.get("name").lower() == api_config["category_name"].lower():
                                category_id = cat.get("id")
                                break
                        
                        if not category_id:
                            # Create the category
                            category_data = {
                                "name": api_config["category_name"],
                                "slug": api_config["category_name"].lower().replace(" ", "-"),
                                "metaDescription": f"Products related to {api_config['category_name']}"
                            }
                            new_category = client.create_category(site_slug, category_data)
                            category_id = new_category.get("id")
                    except Exception as e:
                        logger.error(f"Error getting/creating category: {e}")
                
                if not category_id:
                    logger.warning("No category ID available, skipping API submission")
                else:
                    # Submit each product as a listing
                    submission_results = []
                    if "products" in formatted_data:
                        for i, product in enumerate(formatted_data["products"]):
                            try:
                                # Prepare listing data
                                listing_data = {
                                    "title": product.get("title", f"Product {i+1}"),
                                    "slug": product.get("title", f"product-{i+1}").lower().replace(" ", "-"),
                                    "categoryId": category_id,
                                    "metaDescription": product.get("description", "")[:160] if product.get("description") else "",
                                    "content": product.get("blog_commentary", "") + "\n\n" + product.get("description", ""),
                                    "imageUrl": product.get("images", {}).get("main", "") if isinstance(product.get("images"), dict) else "",
                                    "backlinkUrl": product.get("url", ""),
                                    "backlinkAnchorText": product.get("title", "View Product"),
                                    "backlinkPosition": "prominent",
                                    "backlinkType": "dofollow",
                                    "customFields": {
                                        "product_name": product.get("title", ""),
                                        "brand": product.get("brand", ""),
                                        "price": product.get("price", ""),
                                        "category": product.get("category", "")
                                    }
                                }
                                
                                # Add any specs as custom fields
                                if "specs" in product and isinstance(product["specs"], dict):
                                    for key, value in product["specs"].items():
                                        if key not in listing_data["customFields"]:
                                            listing_data["customFields"][key] = value
                                
                                # Submit the listing
                                result = client.create_listing(site_slug, listing_data)
                                submission_results.append({
                                    "product_title": product.get("title", ""),
                                    "listing_id": result.get("id", ""),
                                    "success": True
                                })
                                logger.info(f"Created listing for {product.get('title', 'Unknown Product')}")
                            except Exception as e:
                                logger.error(f"Error creating listing: {e}")
                                submission_results.append({
                                    "product_title": product.get("title", ""),
                                    "error": str(e),
                                    "success": False
                                })
                    
                    # Save submission results
                    submission_path = os.path.join(PROCESSED_DIR, f"{run_id}_submission_results.json")
                    with open(submission_path, 'w', encoding='utf-8') as f:
                        json.dump(submission_results, f, indent=2)
                    
                    logger.info(f"API submission results saved to: {submission_path}")
        except Exception as e:
            logger.error(f"Error during API submission: {e}")
    
    return formatted_data, raw_path, processed_path

async def main_async():
    """Async main function."""
    parser = argparse.ArgumentParser(
        description='AI-Enhanced SEO Extractor',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Required arguments
    parser.add_argument('search_term', help='What to search for')
    
    # Browser Use options
    parser.add_argument('--source', default='google', help='Where to search (google, amazon, ebay, etc.)')
    parser.add_argument('--site', help='Specific site to search within (e.g., bestbuy.com)')
    parser.add_argument('--max', type=int, default=5, help='Number of products to extract')
    parser.add_argument('--instructions', help='Additional instructions for Browser Use')
    
    # AI formatting options
    parser.add_argument('--llm-type', choices=['ollama', 'openai', 'anthropic'], default=DEFAULT_LLM_TYPE,
                        help='AI service to use for formatting')
    parser.add_argument('--model', help='Specific model to use with the AI service')
    parser.add_argument('--schema', help='Path to a JSON file containing the target schema')
    
    # Blog commentary options
    parser.add_argument('--no-commentary', action='store_true', 
                        help='Disable blog commentary generation')
    parser.add_argument('--commentary-model', default='gpt-3.5-turbo', 
                        help='Model to use for blog commentary generation')
    
    # DirectoryMonster API options
    parser.add_argument('--api-submit', action='store_true', 
                        help='Submit products to DirectoryMonster API')
    parser.add_argument('--api-url', default='http://localhost:3000',
                        help='DirectoryMonster API base URL')
    parser.add_argument('--api-key', help='DirectoryMonster API key')
    parser.add_argument('--site-slug', help='DirectoryMonster site slug')
    parser.add_argument('--category-id', help='DirectoryMonster category ID')
    parser.add_argument('--category-name', help='DirectoryMonster category name (if category_id not provided)')
    
    # Output options
    parser.add_argument('--output-dir', help='Custom output directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Update output directory if specified
    global OUTPUT_DIR, LOGS_DIR, SCREENSHOTS_DIR, RAW_DIR, PROCESSED_DIR
    if args.output_dir:
        OUTPUT_DIR = args.output_dir
        LOGS_DIR = os.path.join(OUTPUT_DIR, 'logs')
        SCREENSHOTS_DIR = os.path.join(OUTPUT_DIR, 'screenshots')
        RAW_DIR = os.path.join(OUTPUT_DIR, 'raw')
        PROCESSED_DIR = os.path.join(OUTPUT_DIR, 'processed')
    
    # Prepare API config if submission is enabled
    api_config = None
    if args.api_submit:
        if not args.api_key:
            logger.warning("API submission enabled but no API key provided, disabling submission")
        elif not args.site_slug:
            logger.warning("API submission enabled but no site slug provided, disabling submission")
        else:
            api_config = {
                "base_url": args.api_url,
                "api_key": args.api_key,
                "site_slug": args.site_slug,
                "category_id": args.category_id,
                "category_name": args.category_name
            }
    
    try:
        # Extract and format the data
        formatted_data, raw_path, processed_path = await extract_and_format(
            search_term=args.search_term,
            source=args.source,
            site=args.site,
            max_products=args.max,
            custom_instructions=args.instructions,
            llm_type=args.llm_type,
            model_name=args.model,
            schema_file=args.schema,
            gen_commentary=not args.no_commentary,
            api_submit=args.api_submit,
            api_config=api_config
        )
        
        # Print a summary
        print(f"\nExtraction and formatting complete for '{args.search_term}'")
        print(f"Raw results: {raw_path}")
        print(f"Formatted results: {processed_path}")
        
        # Try to show a quick count of products found
        try:
            if isinstance(formatted_data, dict) and "products" in formatted_data:
                products = formatted_data["products"]
                print(f"Found {len(products)} products")
                
                # Show a brief summary of each product
                print("\nProduct Summary:")
                for i, product in enumerate(products):
                    print(f"{i+1}. {product.get('title', 'Unknown Product')}")
                    print(f"   URL: {product.get('url', 'No URL')}")
                    print(f"   Price: {product.get('price', 'No price')}")
                    
                    # Show blog commentary if available
                    if "blog_commentary" in product:
                        print(f"   Blog Commentary: {product['blog_commentary']}")
                    
                    print()
            elif isinstance(formatted_data, list):
                print(f"Found {len(formatted_data)} products")
        except Exception as e:
            logger.debug(f"Error showing product summary: {e}")
        
        # Show API submission status if enabled
        if args.api_submit and api_config:
            submission_results_path = os.path.join(PROCESSED_DIR, processed_path.split("/")[-1].replace("_processed.json", "_submission_results.json"))
            if os.path.exists(submission_results_path):
                print(f"\nAPI submission results saved to: {submission_results_path}")
                try:
                    with open(submission_results_path, 'r') as f:
                        results = json.load(f)
                    successful = sum(1 for r in results if r.get("success", False))
                    print(f"Successfully submitted {successful} out of {len(results)} products to DirectoryMonster API")
                except Exception as e:
                    logger.debug(f"Error displaying submission results: {e}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        logger.debug(traceback.format_exc())

def main():
    """Main function."""
    asyncio.run(main_async())

if __name__ == "__main__":
    main()