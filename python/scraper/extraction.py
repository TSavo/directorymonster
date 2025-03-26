"""
Extraction Utilities Component
Handles extracting product information from web pages
"""
import logging
import re
import json
import time
from datetime import datetime
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from scraper.utils import sanitize_text


class ProductExtractor:
    """Extracts product information from web pages."""
    
    def __init__(self, driver, page_analyzer, product_extractor, max_retries=2):
        """
        Initialize a product extractor.
        
        Args:
            driver: Selenium WebDriver instance
            page_analyzer: Component for analyzing page type
            product_extractor: Component for extracting product data
            max_retries (int): Maximum number of retry attempts
        """
        self.driver = driver
        self.page_analyzer = page_analyzer
        self.product_extractor = product_extractor
        self.max_retries = max_retries
        self.logger = logging.getLogger("extraction")
    
    def extract_product_data(self):
        """
        Extract product information from the current page.
        
        Returns:
            dict: Extracted product data or error information
        """
        # Add timestamp and URL logging for debugging
        start_time = time.time()
        current_url = self.driver.current_url
        self.logger.info(f"Starting extraction from URL: {current_url}")
        self.logger.info(f"Page title: {self.driver.title}")
        
        retries = 0
        while retries <= self.max_retries:
            try:
                # Verify this is a product page first
                self.logger.debug("Checking if current page is a product page...")
                is_product, reason = self.page_analyzer.is_product_page(
                    self.driver.current_url,
                    self.driver.title,
                    self._get_page_text()
                )
                
                # Sanitize reason text regardless of result
                safe_reason = sanitize_text(reason)
                
                if not is_product:
                    # Fix formatting by using an f-string instead of format()
                    self.logger.warning(f"Not a product page: {safe_reason}")
                    return {"is_product": False, "error": f"Not a product page: {safe_reason}"}
                
                self.logger.info(f"Page confirmed as product page: {safe_reason}")
                
                # Get page content
                self.logger.debug("Extracting page content...")
                page_text = self._get_page_text()
                page_text_length = len(page_text) if page_text else 0
                self.logger.debug(f"Page text length: {page_text_length} characters")
                
                page_html = self.driver.page_source
                page_html_length = len(page_html) if page_html else 0
                self.logger.debug(f"Page HTML length: {page_html_length} characters")
                
                url = self.driver.current_url
                domain = self._extract_domain(url)
                self.logger.info(f"Extracting from domain: {domain}")
                
                # Extract metadata
                metadata_start = time.time()
                self.logger.debug("Extracting page metadata...")
                metadata = self._extract_page_metadata(page_html)
                metadata_count = len(metadata)
                self.logger.debug(f"Extracted {metadata_count} metadata items in {time.time() - metadata_start:.2f}s")
                
                # Extract potential image URLs
                images_start = time.time()
                self.logger.debug("Extracting potential images...")
                image_candidates = self._extract_potential_images(page_html)
                image_count = image_candidates.count('\n') + 1 if image_candidates else 0
                self.logger.debug(f"Found {image_count} potential image URLs in {time.time() - images_start:.2f}s")
                
                # Extract product data using AI
                extraction_start = time.time()
                self.logger.info("Sending data to AI product extractor...")
                
                # Save relevant debugging information before extraction
                debug_info = {
                    "url": url,
                    "domain": domain, 
                    "metadata": metadata,
                    "page_text_length": len(page_text) if page_text else 0,
                    "image_candidates_count": image_count
                }
                
                # Save debugging info to file
                debug_path = f"pre_extraction_debug_{int(time.time())}.json"
                try:
                    with open(debug_path, "w", encoding="utf-8") as f:
                        json.dump(debug_info, f, indent=2)
                    self.logger.debug(f"Saved pre-extraction debug info to {debug_path}")
                except Exception as e:
                    self.logger.debug(f"Failed to save debug info: {e}")
                
                # Perform the actual extraction
                product_data = self.product_extractor.extract(
                    url, domain, page_text, metadata, image_candidates
                )
                extraction_time = time.time() - extraction_start
                self.logger.info(f"AI extraction completed in {extraction_time:.2f}s")
                
                # Log extraction result details
                if isinstance(product_data, dict):
                    field_count = len(product_data)
                    self.logger.debug(f"Extracted {field_count} fields from product data")
                    
                    # Log keys found/missing for debugging
                    expected_keys = ["product_name", "price", "currency", "description", "brand", "category"]
                    found_keys = [k for k in expected_keys if k in product_data]
                    missing_keys = [k for k in expected_keys if k not in product_data]
                    self.logger.debug(f"Found expected fields: {', '.join(found_keys)}")
                    if missing_keys:
                        self.logger.warning(f"Missing expected fields: {', '.join(missing_keys)}")
                
                # Add additional metadata
                if product_data.get("is_product", False):
                    # Add timestamp
                    product_data["scraped_at"] = datetime.now().isoformat()
                    
                    # Generate slug if missing
                    if "slug" not in product_data and "product_name" in product_data:
                        product_data["slug"] = self._generate_slug(product_data["product_name"])
                    
                    # Using f-string instead of format()
                    product_name = sanitize_text(product_data.get("product_name", "Unknown product"))
                    self.logger.info(f"Successfully extracted product: {product_name}")
                    
                    # Log price information for debugging
                    price = product_data.get("price", "unknown")
                    currency = product_data.get("currency", "unknown")
                    self.logger.info(f"Product price: {price} {currency}")
                
                total_time = time.time() - start_time
                self.logger.info(f"Total extraction process took {total_time:.2f}s")
                return product_data
                
            except Exception as e:
                retries += 1
                # Use f-string and explicitly convert exception to string first
                error_str = str(e)
                safe_error = sanitize_text(error_str)
                error_msg = f"Extraction error: {safe_error}"
                self.logger.error(error_msg)
                
                # Add traceback for better debugging
                import traceback
                self.logger.error(f"Error traceback: {traceback.format_exc()}")
                
                if retries <= self.max_retries:
                    self.logger.info(f"Retrying extraction ({retries}/{self.max_retries})...")
                    retry_delay = 2 * retries  # Exponential backoff
                    self.logger.info(f"Waiting {retry_delay}s before retrying...")
                    time.sleep(retry_delay)
                else:
                    self.logger.error(f"Extraction failed after {retries} attempts")
                    return {"is_product": False, "error": error_msg}
    
    def _get_page_text(self):
        """Get visible text from the current page."""
        try:
            return self.driver.find_element(By.TAG_NAME, "body").text
        except NoSuchElementException:
            self.logger.warning("Could not find body element")
            return ""
    
    def _extract_domain(self, url):
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed_uri = urlparse(url)
            domain = '{uri.netloc}'.format(uri=parsed_uri)
            # Remove www. if present
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except Exception as e:
            self.logger.error("Error extracting domain: {}".format(sanitize_text(str(e))))
            # Fallback to simple extraction
            try:
                domain = url.split('//')[1].split('/')[0]
                if domain.startswith('www.'):
                    domain = domain[4:]
                return domain
            except Exception:
                return url
    
    def _generate_slug(self, text):
        """Generate a URL-friendly slug from text."""
        if not text:
            return "unknown-product"
            
        # Sanitize text first
        safe_text = sanitize_text(text)
        
        # Convert to slug
        import re
        slug = safe_text.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special chars
        slug = re.sub(r'\s+', '-', slug)          # Replace spaces with hyphens
        slug = re.sub(r'-+', '-', slug)           # Remove consecutive hyphens
        slug = slug.strip('-')                     # Trim hyphens from ends
        
        # Ensure we have something
        if not slug:
            return "unknown-product"
            
        return slug
    
    def _extract_page_metadata(self, html):
        """
        Extract metadata from HTML.
        
        Args:
            html (str): Page HTML
            
        Returns:
            dict: Extracted metadata
        """
        metadata = {}
        
        # Extract meta tags
        meta_patterns = {
            'meta_description': r'<meta[^>]*name="description"[^>]*content="([^"]*)"',
            'meta_keywords': r'<meta[^>]*name="keywords"[^>]*content="([^"]*)"',
            'og_title': r'<meta[^>]*property="og:title"[^>]*content="([^"]*)"',
            'og_description': r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"',
            'canonical_url': r'<link[^>]*rel="canonical"[^>]*href="([^"]*)"',
        }
        
        for key, pattern in meta_patterns.items():
            matches = re.findall(pattern, html, re.DOTALL)
            if matches:
                metadata[key] = sanitize_text(matches[0])
        
        # Extract page title
        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.DOTALL)
        if title_match:
            metadata['page_title'] = sanitize_text(title_match.group(1))
        
        return metadata
    
    def _extract_potential_images(self, html):
        """
        Extract potential product image URLs from HTML.
        
        Args:
            html (str): Page HTML
            
        Returns:
            str: Newline-separated list of potential image URLs
        """
        # Find potential product image elements using various patterns
        img_patterns = [
            # Priority 1: Product-specific images
            r'<img[^>]*class="[^"]*(?:product|main|primary|gallery|hero|featured)[^"]*"[^>]*src="([^"]*)"',
            r'<img[^>]*id="[^"]*(?:product|main|primary|gallery|hero|featured)[^"]*"[^>]*src="([^"]*)"',
            r'<img[^>]*(?:data-(?:product|main|primary|large|zoom))[^>]*src="([^"]*)"',
            r'<div[^>]*class="[^"]*(?:product|main|primary|gallery|hero|featured)[^"]*"[^>]*style="[^"]*background-image:\s*url\(\'([^\']*)\'\)',
            r'data-(?:image-large|large-image|zoom-image|hero-image|main-image)="([^"]*)"',
            
            # Priority 2: Open Graph and structured data
            r'<meta[^>]*property="og:image"[^>]*content="([^"]*)"',
            r'<meta[^>]*itemprop="image"[^>]*content="([^"]*)"',
            
            # Priority 3: Large images
            r'<img[^>]*(?:width|height)="[4-9]\d\d"[^>]*src="([^"]*)"',
            r'<img[^>]*src="([^"]*)"[^>]*(?:width|height)="[4-9]\d\d"'
        ]
        
        potential_images = []
        for pattern in img_patterns:
            matches = re.findall(pattern, html, re.DOTALL)
            potential_images.extend(matches)
        
        # Filter and sanitize
        clean_images = []
        for img_url in potential_images:
            # Skip common irrelevant patterns
            if any(skip in img_url.lower() for skip in ['icon', 'logo', 'placeholder', 'spinner', 'loading']):
                continue
                
            # Skip tiny images
            if any(size in img_url.lower() for size in ['16x16', '32x32', '64x64']):
                continue
                
            # Remove duplicates
            if img_url not in clean_images:
                clean_images.append(img_url)
                
            # Limit to top 10 to avoid overwhelmingly long prompts
            if len(clean_images) >= 10:
                break
        
        return "\n".join(clean_images)