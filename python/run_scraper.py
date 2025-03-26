#!/usr/bin/env python3
"""
SEO Product Scraper - Main Entry Point
An elegant composition of components to scrape product data from the web.
"""

import os
import argparse
import json
import logging
import time
import platform
import sys
from datetime import datetime
from scraper.browser import BrowserManager
from scraper.search import SearchEngine
from scraper.extraction import ProductExtractor
from scraper.storage import DataStorage
from ai.ollama_client import OllamaClient
from ai.page_analyzer import PageAnalyzer
from ai.link_selector import LinkSelector
from ai.product_extractor import AIProductExtractor
from scraper.utils import setup_logging


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='SEO Product Scraper')
    
    parser.add_argument('--count', type=int, default=10,
                      help='Number of products to collect (default: 10)')
    
    parser.add_argument('--categories', type=str, nargs='+',
                      help='Product categories to search for (space-separated list)')
    
    parser.add_argument('--min-price', type=float,
                      help='Minimum price filter')
    
    parser.add_argument('--max-price', type=float,
                      help='Maximum price filter')
    
    parser.add_argument('--ollama-model', type=str, default='llama3:latest',
                      help='Ollama model to use (default: llama3:latest)')
    
    parser.add_argument('--ollama-host', type=str, default='localhost',
                      help='Hostname for Ollama API (default: localhost)')
    
    parser.add_argument('--output', type=str, default='./data/products.json',
                      help='Output file path (default: ./data/products.json)')
    
    parser.add_argument('--search-engine', type=str, default='https://duckduckgo.com/',
                      help='Search engine to use (default: https://duckduckgo.com/)')
    
    parser.add_argument('--log-level', type=str, default='INFO',
                      choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                      help='Logging level (default: INFO)')
    
    parser.add_argument('--screenshots', action='store_true',
                      help='Save screenshots for debugging')
    
    parser.add_argument('--debug-ai', action='store_true',
                      help='Save all AI inputs and outputs for debugging')
    
    return parser.parse_args()


def main():
    """Main execution flow."""
    # Start timing for performance tracking
    start_time = time.time()
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Set up logging
    log_level = getattr(logging, args.log_level)
    setup_logging(log_level, log_file="scraper.log")
    logger = logging.getLogger("main")
    
    # Log system information for debugging
    logger.info(f"Starting scraper at {datetime.now().isoformat()}")
    logger.info(f"Python version: {platform.python_version()}")
    logger.info(f"OS: {platform.system()} {platform.release()}")
    logger.info(f"Machine: {platform.machine()}")
    
    # Log configuration
    logger.info(f"Configuration: Products to collect: {args.count}")
    if args.categories:
        logger.info(f"Categories: {', '.join(args.categories)}")
    else:
        logger.info("No specific categories provided, using defaults")
    
    if args.min_price or args.max_price:
        price_range = f"{args.min_price or 'any'} to {args.max_price or 'any'}"
        logger.info(f"Price range: {price_range}")
    
    logger.info(f"Using Ollama model: {args.ollama_model} on {args.ollama_host}")
    logger.info(f"Search engine: {args.search_engine}")
    logger.info(f"Output file: {args.output}")
    
    # Initialize AI components
    logger.info("Initializing AI components...")
    ai_init_start = time.time()
    try:
        ai_client = OllamaClient(args.ollama_model, args.ollama_host)
        
        # Configure debug mode if requested
        if args.debug_ai:
            # Create debug directory
            debug_dir = "ai_debug"
            os.makedirs(debug_dir, exist_ok=True)
            logger.info(f"AI debug mode enabled - saving prompts and responses to {os.path.abspath(debug_dir)}")
            
            # Set debug properties on the client
            ai_client.debug_mode = True
            ai_client.debug_dir = debug_dir
        
        link_selector = LinkSelector(ai_client)
        page_analyzer = PageAnalyzer(ai_client)
        product_extractor = AIProductExtractor(ai_client)
        logger.info(f"AI components initialized in {time.time() - ai_init_start:.2f}s")
    except Exception as e:
        logger.error(f"Failed to initialize AI components: {str(e)}")
        logger.error("Exiting due to AI initialization failure")
        return
    
    # Initialize browser and web components
    logger.info("Initializing browser...")
    browser_init_start = time.time()
    try:
        browser = BrowserManager()
        logger.info(f"Browser initialized in {time.time() - browser_init_start:.2f}s")
        logger.info(f"User agent: {browser.driver.execute_script('return navigator.userAgent;')}")
    except Exception as e:
        logger.error(f"Failed to initialize browser: {str(e)}")
        logger.error("Exiting due to browser initialization failure")
        return
    
    search_engine = SearchEngine(browser.driver, link_selector, ai_client=ai_client)
    product_extraction = ProductExtractor(browser.driver, page_analyzer, product_extractor)
    storage = DataStorage(args.output)
    
    # Configure search parameters
    search_engine.configure(
        categories=args.categories,
        min_price=args.min_price,
        max_price=args.max_price,
        search_url=args.search_engine
    )
    
    # Create directory for screenshots if enabled
    if args.screenshots:
        screenshots_dir = "screenshots"
        os.makedirs(screenshots_dir, exist_ok=True)
        logger.info(f"Screenshots will be saved to {os.path.abspath(screenshots_dir)}")
    
    # Collect products
    products = []
    successful_extractions = 0
    failed_extractions = 0
    search_attempts = 0
    try:
        i = 0
        while i < args.count and search_attempts < args.count * 2:  # Allow for some failed searches
            search_attempts += 1
            iteration_start = time.time()
            logger.info(f"Finding product {i+1}/{args.count} (search attempt {search_attempts})...")
            
            # 1. Search and navigate to product page
            search_start = time.time()
            search_success = search_engine.search_and_navigate()
            search_time = time.time() - search_start
            
            if not search_success:
                logger.warning(f"Search or navigation failed in {search_time:.2f}s, trying again...")
                continue  # Try again without incrementing i
            
            logger.info(f"Search and navigation completed in {search_time:.2f}s")
            
            # Take screenshot after navigation if enabled
            if args.screenshots:
                screenshot_path = os.path.join(screenshots_dir, f"page_{i+1}_{int(time.time())}.png")
                try:
                    browser.driver.save_screenshot(screenshot_path)
                    logger.info(f"Saved navigation screenshot to {screenshot_path}")
                except Exception as e:
                    logger.warning(f"Failed to save navigation screenshot: {str(e)}")
            
            # 2. Extract product data
            extraction_start = time.time()
            product_data = product_extraction.extract_product_data()
            extraction_time = time.time() - extraction_start
            
            # 3. Store valid products
            if product_data.get("is_product", False):
                products.append(product_data)
                successful_extractions += 1
                logger.info(f"Found product: {product_data.get('product_name')} (extracted in {extraction_time:.2f}s)")
                
                # Save intermediate results
                if len(products) % 5 == 0 or len(products) == 1:
                    logger.info(f"Saving intermediate results with {len(products)} products...")
                    storage.save(products)
                
                # Increment i only if we successfully extracted a product
                i += 1
            else:
                failed_extractions += 1
                logger.info(f"Not a product: {product_data.get('error')} (process took {extraction_time:.2f}s)")
            
            iteration_time = time.time() - iteration_start
            logger.info(f"Iteration completed in {iteration_time:.2f}s")
            
            # Log statistics
            if successful_extractions + failed_extractions > 0:
                success_rate = successful_extractions / (successful_extractions + failed_extractions) * 100
                logger.info(f"Current success rate: {success_rate:.1f}% ({successful_extractions} successes, {failed_extractions} failures)")
    
    except KeyboardInterrupt:
        logger.info("Scraper interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
    
    finally:
        # Always clean up resources
        logger.info("Closing browser and cleaning up resources...")
        browser.close()
        
        # Save final results
        if products:
            storage.save(products)
            logger.info(f"Saved {len(products)} products to {args.output}")
            
            # Also print to stdout for Docker logs
            print(json.dumps(products, indent=2))
        else:
            logger.warning("No products were found.")
        
        # Log total runtime
        total_runtime = time.time() - start_time
        logger.info(f"Scraper completed in {total_runtime:.2f}s")
        logger.info(f"Final success rate: {(successful_extractions / (successful_extractions + failed_extractions) * 100):.1f}% if any extractions were attempted")


if __name__ == "__main__":
    main()