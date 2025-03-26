"""
Product Extractor Component
Uses AI to extract detailed product information
"""
import logging
import json
import re
import time
from ai.memory import ConversationMemory
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# Define a Pydantic model for product extraction
class ProductData(BaseModel):
    """Schema for product data extraction results."""
    is_product: bool = Field(..., description="Whether this is a valid product page")
    product_name: Optional[str] = Field(None, description="Full product name/title")
    price: Optional[str] = Field(None, description="Price as text (e.g., '19.99')")
    description: Optional[str] = Field(None, description="Brief product description")
    seo_listing_title: Optional[str] = Field(None, description="Catchy title for a directory listing (55-60 chars)")
    original_commentary: Optional[str] = Field(None, description="Original commentary about the product")
    primary_category: Optional[str] = Field(None, description="Main product category")
    secondary_categories: Optional[List[str]] = Field(None, description="Secondary categories/tags")
    brand: Optional[str] = Field(None, description="Product brand name")
    main_image_url: Optional[str] = Field(None, description="URL of the main product image")
    additional_image_urls: Optional[List[str]] = Field(None, description="URLs of additional product images")
    specifications: Optional[List[str]] = Field(None, description="Product specifications/features")
    related_search_terms: Optional[List[str]] = Field(None, description="Related search terms")
    target_audience: Optional[str] = Field(None, description="Target audience for this product")
    use_cases: Optional[List[str]] = Field(None, description="Possible use cases for this product")
    benefits: Optional[List[str]] = Field(None, description="Key benefits of using this product")
    unique_selling_points: Optional[str] = Field(None, description="Unique selling points")
    backlink_suggestions: Optional[List[str]] = Field(None, description="Backlink anchor text suggestions")
    source_url: Optional[str] = Field(None, description="Source URL of the product page")
    source_domain: Optional[str] = Field(None, description="Source domain of the product page")
    error: Optional[str] = Field(None, description="Error message if extraction failed")


class AIProductExtractor:
    """Extracts detailed product information using AI."""
    
    def __init__(self, ai_client):
        """
        Initialize a product extractor.
        
        Args:
            ai_client: AI client for making predictions
        """
        self.ai_client = ai_client
        self.memory = ConversationMemory("product_extraction", max_items=3)
        self.logger = logging.getLogger("product_extractor")
    
    def extract(self, url, domain, content, metadata, image_candidates):
        """
        Extract product information with context.
        
        Args:
            url (str): Page URL
            domain (str): Page domain
            content (str): Page content
            metadata (dict): Extracted metadata
            image_candidates (str): Potential image URLs
            
        Returns:
            dict: Extracted product data
        """
        # Get previous extraction context from memory
        previous_context = self.memory.get_context()
        
        # Try to use the structured generation if it's available
        try:
            # Check if the AI client supports structured output
            if hasattr(self.ai_client, 'generate_structured'):
                self.logger.info("Using structured product extraction")
                return self._extract_structured(url, domain, content, metadata, image_candidates)
        except ImportError:
            self.logger.warning("Schema parser not available, using standard extraction")
        except Exception as e:
            self.logger.warning(f"Error using structured extraction: {str(e)}, falling back to standard")
            
        # Fall back to regular extraction with fixed JSON formatting
        prompt = f"""
        Analyze this webpage and extract comprehensive product information for an SEO-optimized product directory. 
        
        You MUST format your response as valid JSON with no preamble or explanation.
        
        If this page contains a product, extract the following:

        1. Product name
        2. Price (with currency)
        3. Comprehensive description (3-4 sentences)
        4. Primary category
        5. Secondary categories/tags (5-8 relevant tags)
        6. Brand name
        7. Main image URL
        8. Additional image URLs (up to 3)
        9. Product specifications/features (list of 5-10 key specs)
        10. Related search terms (8-10 terms someone might use to find this product)
        11. Target audience/who would use this
        12. Possible use cases (3-5 different ways this product might be used)
        13. Key benefits (3-5 benefits of using this product)
        14. Unique selling points
        
        Also generate:
        - A catchy title for a directory listing (55-60 characters)
        - Original commentary (6-7 sentences) that discusses the product in an engaging way, mentioning its features, benefits, and potential uses without copying the original description
        - 3 high-quality backlink anchor text suggestions for this product that would be SEO-effective
        
        If this is not a product page, respond with {{\"is_product\": false}}
        
        URL: {url}
        Domain: {domain}
        
        Page content excerpt:
        {content[:4000]}
        
        For image extraction, here are some HTML snippets that might contain product images:
        {image_candidates}
        ```
        """
        
        response = self.ai_client.generate_structured(prompt, ProductData)
        self.logger.info(f"Product extraction response received ({len(response)} chars)")
        
        try:
            # Add source information if not present
            if response.get("is_product", False):
                if "source_url" not in response:
                    response["source_url"] = url
                if "source_domain" not in response:
                    response["source_domain"] = domain
                
                # Store successful extraction in memory
                product_name = response.get("product_name", "Unknown product")
                self.memory.add(f"Extracted: {product_name} from {domain}")
            
            return response

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON decode error: {str(e)}")
            return {"is_product": False, "error": f"Invalid JSON in LLM response: {str(e)}"}
    
    def _extract_structured(self, url, domain, content, metadata, image_candidates):
        """
        Extract product information using structured output with Pydantic schema.
        
        Args:
            url (str): Page URL
            domain (str): Page domain
            content (str): Page content
            metadata (dict): Extracted metadata
            image_candidates (str): Potential image URLs
            
        Returns:
            dict: Extracted product data
        """
        # Prepare structured extraction prompt with stronger JSON enforcement and emphasis on comprehensive data
        prompt = f"""
        You are an expert product information extractor for an e-commerce directory.
        Your task is to analyze this webpage and extract COMPREHENSIVE product information.
        
        EXTREMELY IMPORTANT:
        1. Include ALL available fields, not just the minimum required ones
        2. Your response quality will be rated based on completeness (how many fields you accurately fill)
        
        WEBPAGE TO ANALYZE:
        URL: {url}
        Domain: {domain}
        
        Page content excerpt:
        {content[:4000]}
        
        For image extraction, here are some HTML snippets that might contain product images:
        {image_candidates}
        
        Additional metadata:
        {json.dumps(metadata, indent=2)}
        
        IF NOT A PRODUCT PAGE, set is_product to false with an error message.
        IF THIS IS A PRODUCT PAGE, extract as many details as possible.
        
        REMEMBER: A COMPLETE and COMPREHENSIVE response with ALL fields filled will be rated higher than a minimal response.
        """
        
        # For debugging, save the prompt
        try:
            debug_path = f"extraction_prompt_{int(time.time())}.txt"
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(prompt)
            self.logger.debug(f"Saved extraction prompt to {debug_path}")
        except Exception as e:
            self.logger.debug(f"Could not save prompt: {e}")
        
        try:
            # Use the structured generation with our Pydantic model
            extraction_start = time.time()
            self.logger.info(f"Requesting comprehensive product extraction from AI model")
            
            # Use the proper generate_structured method that handles schema validation
            result = self.ai_client.generate_structured(prompt, ProductData)
            extraction_time = time.time() - extraction_start
            self.logger.info(f"Successfully received structured data in {extraction_time:.2f}s")
            
            # Add source information if not present
            if result.get("is_product", False):
                if "source_url" not in result:
                    result["source_url"] = url
                if "source_domain" not in result:
                    result["source_domain"] = domain
                    
                # Store successful extraction in memory
                product_name = result.get("product_name", "Unknown product")
                self.memory.add(f"Extracted: {product_name} from {domain}")
                
                # Count and log filled fields to measure completeness
                total_fields = 18  # Total possible fields in our schema
                present_fields = [k for k, v in result.items() if v is not None and v != "" and v != [] and v != {}]
                filled_fields = len(present_fields)
                completion_rate = filled_fields / total_fields * 100
                
                self.logger.info(f"Field completion rate: {completion_rate:.1f}% ({filled_fields}/{total_fields} fields)")
                self.logger.info(f"Successfully extracted {filled_fields} fields: {', '.join(present_fields)}")
                
                # Log missing important fields
                missing_fields = [k for k in ["product_name", "price", "description", "brand", "main_image_url"] 
                                 if k not in present_fields]
                if missing_fields:
                    self.logger.warning(f"Missing important fields: {', '.join(missing_fields)}")
            else:
                # Not a product - log the reason
                error_reason = result.get("error", "No reason provided")
                self.logger.info(f"AI determined this is not a product page: {error_reason}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error in structured extraction: {str(e)}")
            error_traceback = self._get_traceback()
            self.logger.error(f"Error traceback: {error_traceback}")
            
            # Attempt to use standard extraction as fallback
            self.logger.info("Falling back to standard extraction after structured extraction failed")
            
            # Create a simplified prompt for fallback extraction
            fallback_prompt = f"""
            Analyze this webpage and determine if it contains a product. 
            Return a simple JSON object with this format:
            
            If it IS a product page:
            {{
                "is_product": true,
                "product_name": "Product Name Here",
                "price": "Price Here",
                "description": "Description Here"
            }}
            
            If it is NOT a product page:
            {{
                "is_product": false,
                "error": "Reason why this isn't a product page"
            }}
            
            URL: {url}
            Page content excerpt: {content[:2000]}
            """
            
            # Get response from AI
            response = self.ai_client.generate(fallback_prompt)
            
            # Try to parse JSON from response
            try:
                # Look for JSON between triple backticks or just find the JSON object
                json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response, re.DOTALL) or re.search(r'({[\s\S]*})', response)
                
                if json_match:
                    json_str = json_match.group(1)
                    fallback_data = json.loads(json_str)
                    
                    # Add source info
                    fallback_data["source_url"] = url
                    fallback_data["source_domain"] = domain
                    
                    self.logger.info("Successfully extracted fallback data")
                    return fallback_data
                else:
                    self.logger.error("Failed to extract JSON from fallback response")
                    return {"is_product": False, "error": "Failed to parse product data"}
                    
            except Exception as fallback_error:
                self.logger.error(f"Fallback extraction also failed: {str(fallback_error)}")
                return {"is_product": False, "error": f"Extraction failed: {str(e)}"}

    def _get_traceback(self):
        """Get the current exception traceback as a string."""
        import traceback
        import io
        buffer = io.StringIO()
        traceback.print_exc(file=buffer)
        return buffer.getvalue()

    # Helper function to save debugging information for failed extractions
    def _save_debug_info(self, content, metadata, url, domain):
        """Save debugging information for problematic extraction attempts."""
        debug_path = f"extraction_debug_{int(time.time())}.json"
        try:
            debug_info = {
                "url": url,
                "domain": domain,
                "metadata": metadata,
                "content_sample": content[:1000] if content else None,
                "timestamp": time.time(),
                "error_time": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            with open(debug_path, "w", encoding="utf-8") as f:
                json.dump(debug_info, f, indent=2)
            
            self.logger.info(f"Saved extraction debug info to {debug_path}")
        except Exception as e:
            self.logger.warning(f"Failed to save debug info: {e}")

