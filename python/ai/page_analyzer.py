"""
Page Analyzer Component
Uses AI to determine page type and content
"""
import logging
import re
from ai.memory import ConversationMemory


class PageAnalyzer:
    """Analyzes web pages to determine their content type."""
    
    def __init__(self, ai_client):
        """
        Initialize a page analyzer.
        
        Args:
            ai_client: AI client for making predictions
        """
        self.ai_client = ai_client
        self.memory = ConversationMemory("page_analysis", max_items=5)
        self.logger = logging.getLogger("page_analyzer")
    
    def is_product_page(self, url, title, content):
        """
        Determine if the current page is a product page.
        
        Args:
            url (str): Page URL
            title (str): Page title
            content (str): Page content
            
        Returns:
            tuple: (is_product, reason)
        """
        # Get previous analysis context from memory
        previous_context = self.memory.get_context()
        
        prompt = f"""
        Analyze this webpage and determine if it's a product page or not.
        
        Previous page analyses:
        {previous_context}
        
        Current URL: {url}
        Current Title: {title}
        
        Page content excerpt:
        {content[:3000]}
        
        A product page typically:
        1. Is focused on a single product (not a list of products)
        2. Has product details like price, description, images
        3. Often has "add to cart" or "buy now" functionality
        4. Contains product specifications or features
        
        Answer with a simple "YES" if this is a product page, or "NO" if it's not (e.g., if it's a search results page, 
        category page, homepage, etc.).
        
        Then, provide a brief explanation for your decision (1-2 sentences).
        
        Format your response exactly like this:
        DECISION: YES or NO
        REASON: Your explanation here
        """
        
        response = self.ai_client.generate(prompt)
        self.logger.info(f"Page analysis response received ({len(response)} chars)")
        
        # Parse the result
        decision_match = re.search(r'DECISION:\s*(YES|NO)', response, re.IGNORECASE)
        reason_match = re.search(r'REASON:\s*(.*?)($|\n)', response, re.DOTALL)
        
        decision = False
        reason = "Could not determine page type"
        
        if decision_match:
            decision = decision_match.group(1).upper() == "YES"
            reason = reason_match.group(1) if reason_match else "No reason provided"
            
            # Store the analysis in memory for context
            self.memory.add(f"URL: {url}, Decision: {'PRODUCT' if decision else 'NOT PRODUCT'}, Reason: {reason}")
        
        self.logger.info(f"Page classification: {'Product page' if decision else 'Not a product page'} - {reason}")
        return decision, reason