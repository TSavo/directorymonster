"""
Search Engine Component
Handles search engine interactions and link selection
"""
import logging
import time
import random
import re
import json
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class SearchEngine:
    """Handles interaction with search engines and product link selection."""
    
    def __init__(self, driver, link_selector, ai_client=None, timeout=15):
        """
        Initialize a search engine interface.
        
        Args:
            driver: Selenium WebDriver instance
            link_selector: Component for selecting product links
            ai_client: AI client for link evaluation
            timeout (int): Timeout in seconds for search operations
        """
        self.driver = driver
        self.link_selector = link_selector
        self.ai_client = ai_client
        self.timeout = timeout
        self.logger = logging.getLogger("search")
        
        # Default configuration
        self.categories = []
        self.min_price = None
        self.max_price = None
        self.search_url = "https://www.google.com/"
        self.search_failures = 0
        self.max_search_failures = 5
        self.current_search_term = ""
    
    def configure(self, categories=None, min_price=None, max_price=None, search_url=None):
        """
        Configure search parameters.
        
        Args:
            categories (list): Product categories to search for
            min_price (float): Minimum price filter
            max_price (float): Maximum price filter
            search_url (str): Search engine URL
        """
        if categories:
            self.categories = categories
        if search_url:
            self.search_url = search_url
        self.min_price = min_price
        self.max_price = max_price
        
    def generate_search_terms(self):
        """
        Generate search terms based on configured categories.
        
        Returns:
            list: List of search terms
        """
        # More specific product search terms
        product_terms = []
        
        # If categories are specified, use them as a base
        if self.categories:
            for category in self.categories:
                # Make each category more specific by adding qualifiers
                product_terms.append(f"{category} specific model")
                product_terms.append(f"{category} top rated")
                product_terms.append(f"{category} buy online")
                product_terms.append(f"{category} product page")
                product_terms.append(f"best {category} to buy")
                
                # Add major brand qualifiers
                brands = ["amazon", "walmart", "target", "etsy", "ebay"]
                for brand in brands:
                    product_terms.append(f"{category} {brand}")
        else:
            # Default categories with specific models
            product_terms = [
                "smartphone samsung galaxy s22",
                "laptop dell xps 15",
                "headphones sony wh-1000xm4",
                "air fryer ninja 4-quart",
                "coffee maker breville barista express",
                "running shoes brooks ghost 14",
                "blender vitamix 5200",
                "watch apple watch series 7",
                "vacuum cleaner dyson v11",
                "camera sony a7iii"
            ]
        
        return product_terms
    
    def ai_select_product_link(self, links, search_term):
        """
        Have the AI evaluate and select the most promising product link.
        
        Args:
            links: List of URLs from search results
            search_term: The original search term
            
        Returns:
            str: Selected product URL or None
        """
        if not links or not self.ai_client:
            return random.choice(links) if links else None
            
        # First try using structured output if available
        try:
            from ai.schema_parser import LinkSelectionResult
            if hasattr(self.ai_client, 'generate_structured'):
                return self._ai_structured_link_selection(links, search_term)
        except ImportError:
            self.logger.warning("Schema parser not available, using standard link selection")
        except Exception as e:
            self.logger.warning(f"Error using structured link selection: {str(e)}")
            
        # Fallback to original method if structured output fails
        return self._ai_standard_link_selection(links, search_term)
    
    def _ai_structured_link_selection(self, links, search_term):
        """
        Select links using structured output with schema validation.
        
        Args:
            links: List of URLs from search results
            search_term: The original search term
            
        Returns:
            str: Selected product URL or None
        """
        from ai.schema_parser import LinkSelectionResult
        
        # Limit to 15 links maximum to avoid overwhelming the AI
        max_links = min(15, len(links))
        sample_links = links[:max_links]
        
        # Create a numbered list with additional analysis for better context
        link_info = []
        for i, link in enumerate(sample_links):
            # Extract domain and path for better analysis
            try:
                from urllib.parse import urlparse
                parsed = urlparse(link)
                domain = parsed.netloc
                path = parsed.path
                
                # Analyze path structure for better classification
                is_likely_product = any([
                    "/dp/" in path,        # Amazon
                    "/p/" in path,         # Many retailers
                    "/product/" in path,    # Common pattern
                    "/item/" in path,       # eBay/Etsy
                    "/itm/" in path,        # eBay
                    ".itm" in path,         # eBay
                    "listing" in path,      # Etsy
                    "-i." in path           # Target/Walmart
                ])
                
                is_likely_category = any([
                    "/c/" in path,
                    "/b/" in path,
                    "/s?" in path,
                    "/category/" in path,
                    "/collection/" in path,
                    "/shop/" in path,
                    "/search" in path
                ])
                
                link_type = "likely_product" if is_likely_product else ("likely_category" if is_likely_category else "unknown")
                
                link_info.append({
                    "num": i+1,
                    "url": link,
                    "domain": domain,
                    "path": path,
                    "type": link_type
                })
            except:
                # Fallback if parsing fails
                link_info.append({
                    "num": i+1,
                    "url": link,
                    "domain": "unknown",
                    "path": "unknown",
                    "type": "unknown"
                })
        
        # Format the link info as a list for the prompt
        links_formatted = "\n".join([
            f"{info['num']}. {info['url']} (Domain: {info['domain']}, Type: {info['type']})" 
            for info in link_info
        ])
        
        # Prepare a prompt specifically designed for structured output
        prompt = f"""
        You are a product link analyzer tasked with selecting the BEST link from search results.
        
        SEARCH TERM: "{search_term}"
        
        You must select exactly ONE link that is most likely to be a direct product page (not a category page).
        
        LINKS TO ANALYZE:
        {links_formatted}
        
        SELECTION CRITERIA:
        1. Prioritize direct product pages over category pages
        2. Look for URL patterns that indicate product pages (e.g., /product/, /item/, /dp/, product ID numbers)
        3. Prefer links from major retailers (Amazon, Walmart, Target, eBay, Etsy, etc.)
        4. URLs ending with ID numbers often indicate product pages
        5. URLs containing 'category', 'collection', 'shop', 'search' typically indicate category pages
        
        Analyze each URL's structure to determine if it's a product page or category page.
        """
        
        # Get structured response from AI
        self.logger.info("Requesting structured link selection from AI")
        result = self.ai_client.generate_structured(prompt, LinkSelectionResult)
        
        try:
            selection = result.get("selection")
            reason = result.get("reason", "No reason provided")
            is_product = result.get("is_product_page", False)
            
            self.logger.info(f"AI structured link selection: #{selection} - {reason} (product: {is_product})")
            
            if 1 <= selection <= len(sample_links):
                selected_link = sample_links[selection - 1]
                self.logger.info(f"Selected link #{selection}: {selected_link}")
                return selected_link
            else:
                self.logger.error(f"Invalid selection number: {selection}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error processing structured link selection: {e}")
            return None
    
    def _ai_standard_link_selection(self, links, search_term):
        """
        Standard (non-structured) method to select product links.
        
        Args:
            links: List of URLs from search results
            search_term: The original search term
            
        Returns:
            str: Selected product URL or None
        """
        # Limit to 20 links maximum to avoid overwhelming the AI
        max_links = min(20, len(links))
        sample_links = links[:max_links]
        links_list = "\n".join([f"{i+1}. {link}" for i, link in enumerate(sample_links)])
        
        prompt = f"""
        Analyze these links from search results for "{search_term}" and determine which ONE is most likely 
        to be a direct product page (not a category page or search results).
        
        Prioritize links from well-known e-commerce companies like Amazon, Target, Walmart, eBay, Etsy, etc.
        
        Links:
        {links_list}
        
        Your task:
        1. Choose the number of the single best link that seems to be a product page
        2. If none are product pages, choose one that is a category page from a major retailer

        RESPOND WITH ONLY A SINGLE NUMBER (1-{max_links}) and nothing else.
        """
        
        # Get AI response
        response = self.ai_client.generate(prompt)
        self.logger.info(f"AI link selection response: {response}")
        
        # Improved number extraction that handles various formats
        # This will find any number in the response, including those with asterisks, etc.
        number_matches = re.findall(r'(\d+)', response)
        
        if number_matches:
            for num_str in number_matches:
                try:
                    selected_num = int(num_str)
                    if 1 <= selected_num <= len(sample_links):
                        selected_link = sample_links[selected_num - 1]
                        self.logger.info(f"AI selected link #{selected_num}: {selected_link}")
                        return selected_link
                except (ValueError, IndexError):
                    continue
        
        # Fallback to random selection
        self.logger.info("Could not parse a valid link number from AI response, using random selection")
        return random.choice(links) if links else None
    
    def search_and_navigate(self):
        """
        Perform a search and navigate to a selected product page.
        
        Returns:
            bool: True if successfully navigated to a product page
        """
        # Check if we've had too many consecutive failures
        if self.search_failures >= self.max_search_failures:
            self.logger.warning(f"Too many consecutive search failures ({self.search_failures})")
            self.search_failures = 0
            return False
            
        try:
            # Generate and execute search
            # Generate search terms
            search_terms = self.generate_search_terms()
            self.current_search_term = random.choice(search_terms)
            
            # Extract the base category for later use in category navigation
            # E.g., from "dolls amazon" extract "dolls" as the base category
            self.base_category = self.current_search_term.split()[0] if ' ' in self.current_search_term else self.current_search_term
            self.logger.info(f"Base category for navigation: {self.base_category}")
            
            # Add price qualifiers if specified
            if self.min_price and self.max_price:
                self.current_search_term += f" price {self.min_price}-{self.max_price}"
            elif self.min_price:
                self.current_search_term += f" price over {self.min_price}"
            elif self.max_price:
                self.current_search_term += f" price under {self.max_price}"
                
            self.logger.info(f"Searching for: {self.current_search_term}")
            
            # Navigate to search engine
            self.driver.get(self.search_url)
            time.sleep(2)
            
            # Handle cookie consent if present
            try:
                accept_buttons = self.driver.find_elements(By.XPATH, 
                                                         "//button[contains(., 'Accept') or contains(., 'I agree') or contains(., 'Agree')]")
                if accept_buttons:
                    accept_buttons[0].click()
                    time.sleep(1)
            except Exception:
                pass  # Ignore if no cookie dialog
            
            # Find search box and submit search
            try:
                # Try different search box selectors
                search_selectors = [
                    (By.NAME, "q"),              # Google, DuckDuckGo
                    (By.NAME, "query"),          # Some search engines
                    (By.NAME, "search"),         # Generic
                    (By.ID, "search-box"),       # Generic
                    (By.CSS_SELECTOR, "input[type='search']")  # Generic
                ]
                
                search_box = None
                for selector_type, selector_value in search_selectors:
                    try:
                        search_box = self.driver.find_element(selector_type, selector_value)
                        break
                    except NoSuchElementException:
                        continue
                
                if not search_box:
                    self.logger.error("Could not find search box")
                    self.search_failures += 1
                    return False
                
                search_box.clear()
                search_box.send_keys(self.current_search_term)
                search_box.submit()
                self.logger.info("Search submitted")
                
            except (TimeoutException, NoSuchElementException) as e:
                self.logger.error(f"Could not find search box: {str(e)}")
                self.search_failures += 1
                return False
            
            # Wait for search results
            time.sleep(5)  # Ensure page has time to load
            
            # Log current URL and title for debugging
            self.logger.info(f"Current URL after search: {self.driver.current_url}")
            self.logger.info(f"Page title: {self.driver.title}")
            
            # Check for CAPTCHA
            if self._is_captcha_page():
                self.logger.warning("Detected CAPTCHA page")
                self.search_failures += 1
                return False
            
            # Extract all links from search results
            all_links = self.driver.find_elements(By.CSS_SELECTOR, "a[href]")
            links = [link.get_attribute("href") for link in all_links 
                    if link.get_attribute("href") and 
                    link.get_attribute("href").startswith("http")]
            
            # Filter out search engine links and other non-product sites
            filtered_links = []
            for link in links:
                # Skip search engine results pages
                if any(search_site in link.lower() for search_site in ["google.", "bing.", "duckduckgo.", "yahoo.", "baidu."]):
                    continue
                    
                # Skip common non-product sites
                if any(non_product in link.lower() for non_product in ["wikipedia.", "youtube.", "facebook.", "twitter.", "instagram."]):
                    continue
                    
                filtered_links.append(link)
            
            if not filtered_links:
                self.logger.warning("No suitable links found after filtering")
                self.search_failures += 1
                return False
                
            # Save first 5 links for debugging
            for i, link in enumerate(filtered_links[:5]):
                self.logger.info(f"Found link {i+1}: {link}")
            
            # Use AI to select the best product link
            selected_link = self.ai_select_product_link(filtered_links, self.current_search_term)
            
            if not selected_link:
                self.logger.warning("Failed to select a link")
                self.search_failures += 1
                return False
                
            # Navigate to selected link
            self.logger.info(f"Navigating to selected link: {selected_link}")
            self.driver.get(selected_link)
            
            # Allow page to load fully
            time.sleep(5)
            
            # Take screenshot for debugging
            try:
                screenshot_path = f"debug_page_{int(time.time())}.png"
                self.driver.save_screenshot(screenshot_path)
                self.logger.info(f"Saved page screenshot to {screenshot_path}")
            except Exception as e:
                self.logger.warning(f"Failed to save screenshot: {e}")
                
            # ----- ENHANCED: Smart Page Analysis with Navigation Stack -----
            # Initialize navigation stack and depth counter
            navigation_stack = []  # To keep track of visited URLs
            navigation_depth = 0
            max_navigation_depth = 5  # Maximum navigation depth
            
            # Main navigation loop
            while navigation_depth < max_navigation_depth:
                current_url = self.driver.current_url
                navigation_stack.append(current_url)
                self.logger.info(f"Navigation depth: {navigation_depth+1}/{max_navigation_depth}, URL: {current_url}")
                
                # Take screenshot for debugging if not already done
                try:
                    screenshot_path = f"page_depth_{navigation_depth}_{int(time.time())}.png"
                    self.driver.save_screenshot(screenshot_path)
                    self.logger.info(f"Saved page screenshot to {screenshot_path}")
                except Exception as e:
                    self.logger.warning(f"Failed to save screenshot: {e}")
                
                # Use AI to analyze the current page comprehensively
                analysis_result = self._ai_analyze_page()
                
                if not analysis_result:
                    self.logger.error("Failed to analyze page, aborting navigation")
                    self.search_failures += 1
                    return False
                    
                page_type = analysis_result.get("page_type", "NEITHER")
                confidence = analysis_result.get("confidence", 0)
                reason = analysis_result.get("reason", "No reason provided")
                
                self.logger.info(f"AI classified page as: {page_type} (confidence: {confidence}%) - {reason}")
                
                # Take action based on page type
                if page_type == "PRODUCT":
                    # We've found a product page, navigation successful
                    self.logger.info("Successfully navigated to a product page")
                    self.search_failures = 0
                    return True
                    
                elif page_type == "CATEGORY":
                    # Process recommended links for category page
                    recommended_links = analysis_result.get("recommended_links", [])
                    self.logger.info(f"Category page detected with {len(recommended_links)} recommended links")
                    
                    if not recommended_links:
                        self.logger.warning("No recommended links found on category page")
                        # Try traditional method as fallback
                        if self._select_product_from_category():
                            navigation_depth += 1
                            continue
                        else:
                            self.logger.warning("Failed to select product from category page")
                            break
                            
                    # Select a link from the AI recommendations
                    if len(recommended_links) == 1:
                        next_link = recommended_links[0]["url"]
                        next_link_reason = recommended_links[0].get("reason", "Only option available")
                    else:
                        # Pick the highest rank recommendation if multiple exist
                        next_link = recommended_links[0]["url"]
                        next_link_reason = recommended_links[0].get("reason", "Highest ranked option")
                    
                    self.logger.info(f"Selected next link: {next_link}")
                    self.logger.info(f"Selection reason: {next_link_reason}")
                    
                    # Check for navigation loops
                    if next_link in navigation_stack:
                        self.logger.warning(f"Navigation loop detected, URL already visited: {next_link}")
                        # Try next recommendation if available
                        if len(recommended_links) > 1:
                            next_link = recommended_links[1]["url"]
                            self.logger.info(f"Trying alternative link: {next_link}")
                        else:
                            self.logger.warning("No alternative links available, aborting navigation")
                            break
                    
                    # Navigate to the selected link
                    try:
                        self.driver.get(next_link)
                        time.sleep(3)  # Wait for page to load
                        navigation_depth += 1
                        continue
                    except Exception as e:
                        self.logger.error(f"Failed to navigate to link: {e}")
                        break
                    
                else:  # NEITHER
                    # Neither a product nor category page
                    self.logger.warning(f"Page is neither a product nor category page: {reason}")
                    break
                    
                # Break if we've reached max depth (this is a safeguard)
                if navigation_depth >= max_navigation_depth:
                    self.logger.warning(f"Reached maximum navigation depth ({max_navigation_depth})")
            
            # If we exited the loop without finding a product page, consider it a failure
            self.search_failures += 1
            return False
            
        except Exception as e:
            self.logger.error(f"Error in search process: {str(e)}")
            import traceback
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            self.search_failures += 1
            return False
    
    def _ai_analyze_page(self):
        """
        Use AI to comprehensively analyze the current page and return structured results.
        
        Returns:
            dict: JSON result with page classification and navigation recommendations
        """
        start_time = time.time()
        self.logger.info("Performing comprehensive AI page analysis")
        
        if not self.ai_client:
            # Fallback if no AI client is available
            self.logger.warning("No AI client available, using heuristic detection")
            is_category = self._is_category_page()
            if is_category:
                return {
                    "page_type": "CATEGORY",
                    "confidence": 70,
                    "reason": "Heuristic detection (no AI available)",
                    "recommended_links": []
                }
            else:
                return {
                    "page_type": "PRODUCT",
                    "confidence": 60,
                    "reason": "Assuming product page based on heuristics"
                }
        
        # Extract current page information
        url = self.driver.current_url
        title = self.driver.title
        
        # Get a sample of the page text (more content for better analysis)
        try:
            body_text = self.driver.find_element(By.TAG_NAME, "body").text[:1500]
        except:
            body_text = "Failed to extract page text"
        
        # Extract potential links on the page for category page navigation
        page_links = []
        try:
            # Focus on links that likely lead to products
            link_elements = self.driver.find_elements(By.CSS_SELECTOR, 
                'a[href*="product"], a[href*="item"], a[href*="/p/"], a[href*="/dp/"], ' + 
                'a[class*="product"], a[class*="item"], a.listing-link, a[data-listing-id], ' +
                'a.s-item__link, a[data-test="product-title"]')
                
            # Include images wrapped in links, common in e-commerce
            if len(link_elements) < 5:
                link_elements.extend(self.driver.find_elements(By.CSS_SELECTOR, 'a:has(img)'))
                
            # Gather link info
            for i, link in enumerate(link_elements[:15]):  # Limit to 15 links
                try:
                    href = link.get_attribute("href")
                    if href and href.startswith("http") and "javascript:" not in href:
                        text = link.text or link.get_attribute("title") or "Unnamed link"
                        page_links.append({
                            "index": i + 1,
                            "text": text[:50].strip(),  # Truncate long text
                            "url": href
                        })
                except:
                    continue
                    
        except Exception as e:
            self.logger.warning(f"Error extracting page links: {e}")
        
        # Count key page elements as hints
        try:
            product_elements = len(self.driver.find_elements(By.CSS_SELECTOR, 
                'div.product, li.product, div.item, div[class*="product"], div[class*="item"]'))
            grid_elements = len(self.driver.find_elements(By.CSS_SELECTOR, 
                'div.grid, ul.grid, div.products, ul.products, div[class*="grid"]'))
            add_to_cart_elements = len(self.driver.find_elements(By.XPATH, 
                '//*[contains(text(), "Add to Cart") or contains(text(), "Buy Now") or contains(@class, "add-to-cart")]'))
            element_counts = {
                "product_elements": product_elements,
                "grid_elements": grid_elements,
                "cart_buttons": add_to_cart_elements
            }
        except:
            element_counts = {"error": "Failed to count page elements"}
        
        # Get search context info
        search_term = getattr(self, 'current_search_term', "Unknown search term")
        base_category = getattr(self, 'base_category', "Unknown category")
        
        # Create the comprehensive analysis prompt with improved schema and instructions
        prompt = f"""
        You are an AI shopping assistant analyzing an e-commerce webpage.
        Analyze this page and provide a structured response in JSON format.
        
        SEARCH CONTEXT:
        Search term: "{search_term}"
        Base category: "{base_category}"
        
        PAGE INFORMATION:
        URL: {url}
        Title: {title}
        Content sample: {body_text}
        Element counts: {json.dumps(element_counts)}
        
        AVAILABLE LINKS ON THE PAGE:
        {json.dumps(page_links, indent=2)}
        
        PAGE TYPE DEFINITIONS:
        - PRODUCT page: A page focused on a single product with details, price, and purchase options
        - CATEGORY page: A page showing multiple products in a list or grid with limited details per item
        - NEITHER: Not related to products (homepage, blog, error page, captcha, etc.)
        
        JSON SCHEMA:
        {{
          "page_type": string,         // Must be exactly "PRODUCT", "CATEGORY", or "NEITHER"
          "confidence": number,        // Integer from 0-100 indicating confidence level
          "reason": string,            // Brief explanation of classification
          "recommended_links": [       // ONLY include for CATEGORY pages, omit for others
            {{
              "url": string,           // Full URL of recommended product link
              "reason": string         // Why this link was selected (e.g., "Matches {base_category}")
            }}
          ]
        }}
        
        INSTRUCTIONS FOR LINK RECOMMENDATIONS:
        IF page_type is "CATEGORY":
            - Include 1-3 links that are most likely to be PRODUCT pages (not subcategories)
            - Prioritize links that match the search term "{search_term}" or category "{base_category}"
            - Select links that appear to be specific products with price information
            - Avoid links to search results, filters, or "view all" type pages
            - If page has > 10 products, try to select popular or featured ones
        ELSE:
            - Do NOT include the "recommended_links" field at all
        
        EXAMPLES:
        For a PRODUCT page:
        {{
          "page_type": "PRODUCT",
          "confidence": 95,
          "reason": "Page focuses on a single {base_category} product with price, description, and add to cart button"
        }}
        
        For a CATEGORY page:
        {{
          "page_type": "CATEGORY",
          "confidence": 85,
          "reason": "Page displays multiple {base_category} products in a grid format with thumbnails and brief descriptions",
          "recommended_links": [
            {{
              "url": "https://example.com/product/123",
              "reason": "This appears to be a specific {base_category} product with clear pricing information"
            }},
            {{
              "url": "https://example.com/product/456",
              "reason": "Featured {base_category} item that closely matches search term"
            }}
          ]
        }}
        
        For a NEITHER page:
        {{
          "page_type": "NEITHER",
          "confidence": 70,
          "reason": "This is a blog post about {base_category} products but doesn't sell them directly"
        }}
        
        RETURN ONLY VALID JSON WITH NO ADDITIONAL TEXT OR EXPLANATION.
        """
        
        # Use schema-based structured output if available
        try:
            from ai.schema_parser import PageAnalysisResult
            
            # Generate structured response using the PageAnalysisResult schema
            result = self.ai_client.generate_structured(prompt, PageAnalysisResult)
            
            # Add empty recommended_links array for CATEGORY if missing
            if result.get("page_type") == "CATEGORY" and "recommended_links" not in result:
                result["recommended_links"] = []
                
            total_time = time.time() - start_time
            self.logger.info(f"AI page analysis completed in {total_time:.2f}s: {result['page_type']} (confidence: {result['confidence']}%)")
            return result
            
        except ImportError:
            self.logger.warning("Schema parser not available, using manual JSON parsing")
            
            # Fallback to original implementation if schema parser is not available
            # Get AI response
            response = self.ai_client.generate(prompt)
            
            # Log response for debugging (truncated)
            response_preview = response[:100] + "..." if len(response) > 100 else response
            self.logger.debug(f"AI page analysis response: {response_preview}")
            
            # Parse JSON response manually
            try:
                # Clean up the response - extract JSON if wrapped in other text
                response = response.strip()
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0].strip()
                elif "```" in response:
                    response = response.split("```")[1].strip()
                    
                result = json.loads(response)
                
                # Validate the required fields
                if "page_type" not in result:
                    self.logger.warning("Missing 'page_type' in AI response")
                    result["page_type"] = "NEITHER"
                    
                if "confidence" not in result:
                    result["confidence"] = 50
                    
                if "reason" not in result:
                    result["reason"] = "No reason provided"
                    
                # Improved validation for recommended_links
                if result["page_type"] == "CATEGORY":
                    if "recommended_links" not in result:
                        self.logger.warning("Missing 'recommended_links' for CATEGORY page, adding empty array")
                        result["recommended_links"] = []
                    elif not isinstance(result["recommended_links"], list):
                        self.logger.warning("Invalid 'recommended_links' format, should be an array")
                        result["recommended_links"] = []
                    else:
                        # Validate each link in recommended_links has required fields
                        valid_links = []
                        for link in result["recommended_links"]:
                            if isinstance(link, dict) and "url" in link:
                                if not link.get("reason"):
                                    link["reason"] = f"Product appears related to {base_category}"
                                valid_links.append(link)
                        result["recommended_links"] = valid_links
                elif "recommended_links" in result:
                    # Remove recommended_links if page type is not CATEGORY
                    self.logger.warning(f"Found 'recommended_links' for {result['page_type']} page, removing it")
                    del result["recommended_links"]
                    
                total_time = time.time() - start_time
                self.logger.info(f"AI page analysis completed in {total_time:.2f}s: {result['page_type']} (confidence: {result['confidence']}%)")
                return result
                
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse AI response as JSON: {e}")
                self.logger.debug(f"Raw response: {response}")
                return None
            except Exception as e:
                self.logger.error(f"Error processing AI page analysis: {e}")
                return None

    def _is_category_page(self):
        """
        Detect if the current page is a category/listing page with multiple products.
        
        Returns:
            bool: True if it appears to be a category page
        """
        # Common patterns for category pages across e-commerce sites
        category_indicators = [
            # URL patterns
            any(pattern in self.driver.current_url.lower() for pattern in 
                ['/category/', '/collection/', '/shop/', '/search', '/c/', '/s?', '/b?', '/market/']),
            
            # Multiple product elements
            len(self.driver.find_elements(By.CSS_SELECTOR, 
                'div.product, li.product, div.item, div[class*="product"], div[class*="item"]')) > 3,
                
            # Grid layouts common in category pages
            len(self.driver.find_elements(By.CSS_SELECTOR, 
                'div.grid, ul.grid, div.products, ul.products, div.items, div[class*="grid"], div[class*="productGrid"]')) > 0
        ]
        
        # If any indicators are true, it's likely a category page
        return any(category_indicators)
        
    def _ai_select_category_product(self, products):
        """
        Have the AI evaluate and select the best product from a category page.
        
        Args:
            products: List of product dictionaries with title, price, href
            
        Returns:
            dict: Selected product dictionary or None
        """
        start_time = time.time()
        self.logger.info(f"AI selecting from {len(products)} products on category page")
        
        if not products or not self.ai_client:
            self.logger.warning("No products or AI client not available, using random selection")
            return random.choice(products) if products else None
            
        # Format product information for AI evaluation
        max_products = min(15, len(products))  # Limit to 15 products to avoid overwhelming the AI
        product_info = []
        
        for i, product in enumerate(products[:max_products]):
            # Format each product with number, title and price
            product_info.append(f"{i+1}. {product['title']} - {product['price']}")
            # Log product details for debugging
            self.logger.debug(f"Product {i+1}: {product['title']} - {product['price']} - {product['href'][:60]}...")
        
        products_list = "\n".join(product_info)
        
        # Create a prompt focused on finding the best product
        prompt = f"""
        You are browsing a category page with these products. Select the SINGLE BEST product based on:
        1. It appears to be a specific product (not a category)
        2. It has reasonable pricing information
        3. It seems to be a popular or well-known item
        4. It's from a reputable brand if brand information is available
        
        Category: {self.base_category if hasattr(self, 'base_category') else 'Unknown'}
        
        Products:
        {products_list}
        
        RESPOND WITH ONLY A SINGLE NUMBER (1-{max_products}) representing your chosen product and nothing else.
        """
        
        # Get AI response
        ai_start_time = time.time()
        response = self.ai_client.generate(prompt)
        ai_response_time = time.time() - ai_start_time
        self.logger.info(f"AI product selection response received in {ai_response_time:.2f}s: {response}")
        
        # Extract number from response
        number_matches = re.findall(r'(\d+)', response)
        
        if number_matches:
            for num_str in number_matches:
                try:
                    selected_num = int(num_str)
                    if 1 <= selected_num <= max_products:
                        selected_product = products[selected_num - 1]
                        self.logger.info(f"AI selected product #{selected_num}: {selected_product['title']}")
                        
                        total_time = time.time() - start_time
                        self.logger.info(f"AI product selection completed in {total_time:.2f}s")
                        return selected_product
                except (ValueError, IndexError) as e:
                    self.logger.error(f"Error processing selected number {num_str}: {e}")
        
        # Fallback to random selection
        self.logger.info("Could not parse a valid product number from AI response, using random selection")
        selected_product = random.choice(products) if products else None
        
        if selected_product:
            self.logger.info(f"Randomly selected product: {selected_product['title']}")
            
        total_time = time.time() - start_time
        self.logger.info(f"Product selection completed (fallback) in {total_time:.2f}s")
        return selected_product
    
    def _select_product_from_category(self):
        """
        Select and click on a product from a category/listing page using AI if available.
        
        Returns:
            bool: True if successful
        """
        start_time = time.time()
        self.logger.info("Attempting to select product from category page")
        
        # Capture DOM state for debugging 
        dom_stats = {
            "total_elements": len(self.driver.find_elements(By.XPATH, "//*")),
            "links": len(self.driver.find_elements(By.TAG_NAME, "a")),
            "images": len(self.driver.find_elements(By.TAG_NAME, "img")),
            "page_title": self.driver.title,
            "url": self.driver.current_url
        }
        self.logger.debug(f"Page DOM statistics: {json.dumps(dom_stats)}")
        
        # Common selectors for product links across e-commerce sites
        product_selectors = [
            # Generic product selectors
            'a[href*="product"]', 'a[href*="item"]', 'a[href*="/p/"]', 'a[href*="/dp/"]', 
            'a[class*="product"]', 'a[class*="item"]',
            
            # Amazon specific
            'a[href*="/dp/"]', 'a.a-link-normal',
            
            # Etsy specidfic
            'a.listing-link', 'a[data-listing-id]',
            
            # eBay specific
            'a.s-item__link', 
            
            # Walmart specific
            'a[link-identifier="linkProductTitle"]',
            
            # Target specific
            'a[data-test="product-title"]',
            
            # Generic fallbacks
            'a:has(img):has(div.price)', 'a:has(div.product-title)',
            
            # Last resort - any link with an image and some text
            'a:has(img):has(span)', 'a:has(img):has(div)'
        ]
        
        # Try each selector until we find product links
        all_products = []
        selector_stats = {}
        
        for selector in product_selectors:
            selector_start = time.time()
            try:
                product_links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                selector_stats[selector] = len(product_links)
                
                if product_links:
                    self.logger.debug(f"Found {len(product_links)} product links with selector: {selector}")
                    
                    # Filter out any non-product links (like "View All", "Next Page", etc.)
                    filtered_links = [link for link in product_links 
                                    if not any(skip in (link.text or "").lower() 
                                            for skip in ["view all", "see all", "next", "previous", "page"])]
                    
                    if filtered_links:
                        self.logger.debug(f"After filtering: {len(filtered_links)} product links remain")
                        
                        # Collect information about each product for AI evaluation
                        for link in filtered_links[:min(20, len(filtered_links))]:
                            try:
                                title = link.text or link.get_attribute("title") or "Unknown product"
                                href = link.get_attribute("href") or "No URL"
                                
                                # Try to find price near this product link
                                price = "Unknown price"
                                try:
                                    # Look for price in the link itself or parent/sibling elements
                                    price_elements = link.find_elements(By.CSS_SELECTOR, 
                                        "span[class*='price'], div[class*='price'], span.money, .price")
                                    
                                    if not price_elements:
                                        # Try to find price in parent container
                                        parent = link.find_element(By.XPATH, "./..")
                                        price_elements = parent.find_elements(By.CSS_SELECTOR, 
                                            "span[class*='price'], div[class*='price'], span.money, .price")
                                        
                                    if price_elements:
                                        price = price_elements[0].text.strip()
                                except Exception as price_err:
                                    self.logger.debug(f"Price extraction error: {price_err}")
                                    pass  # Price extraction is optional
                                    
                                all_products.append({
                                    "element": link,
                                    "title": title,
                                    "price": price,
                                    "href": href
                                })
                            except Exception as e:
                                self.logger.warning(f"Error extracting product info: {e}")
                        
                        # If we found products, break out of the selector loop
                        if all_products:
                            self.logger.info(f"Found {len(all_products)} products with selector {selector}")
                            break
            except Exception as e:
                self.logger.warning(f"Error with selector {selector}: {e}")
            
            selector_time = time.time() - selector_start
            if selector_time > 0.5:  # Log slow selectors
                self.logger.debug(f"Selector {selector} took {selector_time:.2f}s to process")
        
        # Log selector stats for debugging
        self.logger.debug(f"Selector statistics: {json.dumps(selector_stats)}")
        
        if not all_products:
            self.logger.warning("Could not find any product links on category page")
            total_time = time.time() - start_time
            self.logger.info(f"Product selection attempt failed in {total_time:.2f}s")
            return False
            
        # Use AI to select the best product if AI client is available
        if self.ai_client:
            selected_product = self._ai_select_category_product(all_products)
        else:
            # Fallback to random selection if no AI client
            selected_product = random.choice(all_products)
            
        if not selected_product:
            self.logger.warning("Failed to select a product")
            total_time = time.time() - start_time
            self.logger.info(f"Product selection attempt failed in {total_time:.2f}s")
            return False
            
        # Log what we're clicking
        self.logger.info(f"Clicking product: {selected_product['title']} ({selected_product['href']}) - {selected_product['price']}")
        
        # Scroll to element and click
        try:
            self.logger.debug("Scrolling to product element")
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", selected_product["element"])
            time.sleep(1)  # Allow scroll to complete
            
            self.logger.debug("Attempting to click product element")
            selected_product["element"].click()
            
            self.logger.info("Successfully clicked product element")
            total_time = time.time() - start_time
            self.logger.info(f"Product selection completed in {total_time:.2f}s")
            return True
        except Exception as e:
            self.logger.warning(f"Failed to click product: {e}")
            # Try JavaScript click as fallback
            try:
                self.logger.debug("Attempting JavaScript click")
                self.driver.execute_script("arguments[0].click();", selected_product["element"])
                self.logger.info("Successfully clicked product with JavaScript")
                total_time = time.time() - start_time
                self.logger.info(f"Product selection completed (JS fallback) in {total_time:.2f}s")
                return True
            except Exception as js_e:
                self.logger.warning(f"JavaScript click also failed: {js_e}")
                
        total_time = time.time() - start_time
        self.logger.info(f"Product selection attempt failed in {total_time:.2f}s")
        return False
    
    def _is_captcha_page(self):
        """
        Check if current page is a CAPTCHA challenge with detailed logging.
        
        Returns:
            bool: True if CAPTCHA is detected
        """
        try:
            page_source = self.driver.page_source.lower()
            page_url = self.driver.current_url
            page_title = self.driver.title
            
            self.logger.info(f"Checking for CAPTCHA on page: {page_title} | {page_url}")
            
            captcha_indicators = [
                "captcha", "robot check", "automated access", 
                "unusual traffic", "prove you're human", "security check"
            ]
            
            for indicator in captcha_indicators:
                if indicator in page_source:
                    self.logger.warning(f"CAPTCHA indicator found: '{indicator}'")
                    
                    # Save screenshot for verification
                    try:
                        screenshot_path = f"captcha_detected_{int(time.time())}.png"
                        self.driver.save_screenshot(screenshot_path)
                        self.logger.info(f"Saved CAPTCHA screenshot to {screenshot_path}")
                    except Exception as e:
                        self.logger.warning(f"Failed to save CAPTCHA screenshot: {e}")
                        
                    return True
                    
            self.logger.info("No CAPTCHA indicators found")
            return False
            
        except Exception as e:
            self.logger.error(f"Error in CAPTCHA detection: {str(e)}")
            return False