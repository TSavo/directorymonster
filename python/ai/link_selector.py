"""
Link Selector Component
Uses AI to intelligently select the most promising product links
"""
import logging
import random
import re
import time
import json
from ai.memory import ConversationMemory


class LinkSelector:
    """Intelligently selects the best product links using AI."""
    
    def __init__(self, ai_client):
        """
        Initialize a link selector.
        
        Args:
            ai_client: AI client for making predictions
        """
        self.ai_client = ai_client
        self.memory = ConversationMemory("link_selection", max_items=10)
        self.logger = logging.getLogger("link_selector")
        self.chosen_links = []
    
    def select_link(self, links, current_url, search_term):
        """
        Select the most promising product link from the given options.
        
        Args:
            links (list): List of link URLs
            current_url (str): The current page URL
            search_term (str): The search term that was used
            
        Returns:
            str: Selected link URL or None if selection failed
        """
        start_time = time.time()
        
        if not links:
            self.logger.warning("No links provided to select from")
            return None
            
        self.logger.info(f"Selecting from {len(links)} links for search term: '{search_term}'")
        
        # Log first 3 links for debugging
        for i, link in enumerate(links[:3]):
            self.logger.debug(f"Sample link {i+1}: {link}")
            
        # Filter out previously chosen links
        new_links = [link for link in links if link not in self.chosen_links]
        
        self.logger.debug(f"After filtering previously chosen links: {len(new_links)} links remain")
        if not new_links:
            self.logger.warning("No new links available, resetting history")
            self.chosen_links = []
            new_links = links
        
        # If too many links, sample a manageable number
        if len(new_links) > 10:
            sample_links = random.sample(new_links, 10)
            self.logger.debug(f"Sampled {len(sample_links)} links from {len(new_links)} available links")
        else:
            sample_links = new_links
            
        # Log domain distribution for debugging
        domains = {}
        for link in sample_links:
            try:
                domain = link.split("//")[1].split("/")[0]
                domains[domain] = domains.get(domain, 0) + 1
            except:
                pass
                
        self.logger.debug(f"Domain distribution in link sample: {json.dumps(domains)}")
            
        # Create numbered list of links for easier reference
        numbered_links = "\n".join([f"{i+1}. {link}" for i, link in enumerate(sample_links)])
        
        # Get previous selection context from memory
        previous_context = self.memory.get_context()
        
        prompt = f"""
        You are a product discovery assistant helping find interesting products online.
        
        Current search term: "{search_term}"
        Current page: {current_url}
        
        Previous selections:
        {previous_context}
        
        Please analyze these potential product links and select the SINGLE most promising one that:
        1. Is most likely to be a product page (not a category or search results page)
        2. Is different from previous selections
        3. Appears most relevant to the search term
        4. Seems to be from a legitimate store (not spam)
        
        Available links:
        {numbered_links}
        
        Respond ONLY with the number of your selection (1-{len(sample_links)}) and a brief reason. Format:
        SELECTION: [number]
        REASON: [brief explanation]
        """
        
        self.logger.debug("Sending link selection prompt to AI")
        ai_start_time = time.time()
        response = self.ai_client.generate(prompt)
        ai_time = time.time() - ai_start_time
        
        self.logger.info(f"AI link selection response received ({len(response)} chars) in {ai_time:.2f}s")
        self.logger.debug(f"AI response: {response[:100]}...")  # Log beginning of response
        
        # Add to memory
        self.memory.add(f"Search: '{search_term}', Selected: {response}")
        
        # Extract selection number
        selection_match = re.search(r'SELECTION:\s*(\d+)', response, re.IGNORECASE)
        
        if selection_match:
            try:
                selection_num = int(selection_match.group(1))
                if 1 <= selection_num <= len(sample_links):
                    selected_link = sample_links[selection_num - 1]
                    self.chosen_links.append(selected_link)
                    
                    # Extract reason if available
                    reason_match = re.search(r'REASON:\s*(.*?)(?:\n|$)', response, re.IGNORECASE | re.DOTALL)
                    reason = reason_match.group(1).strip() if reason_match else "No reason provided"
                    self.logger.info(f"Selected link #{selection_num}: {selected_link}")
                    self.logger.info(f"Selection reason: {reason}")
                    
                    # Limit history length
                    if len(self.chosen_links) > 20:
                        self.chosen_links = self.chosen_links[-20:]
                        
                    total_time = time.time() - start_time
                    self.logger.info(f"Link selection completed in {total_time:.2f}s")
                    return selected_link
                else:
                    self.logger.error(f"Selection number {selection_num} out of range (1-{len(sample_links)})")
                    
            except (ValueError, IndexError) as e:
                self.logger.error(f"Error parsing selection: {e}")
        else:
            self.logger.error("No selection number found in AI response")
        
        # Fallback to random selection if parsing fails
        self.logger.warning("Couldn't parse AI selection, using fallback")
        selected_link = random.choice(sample_links)
        self.chosen_links.append(selected_link)
        
        total_time = time.time() - start_time
        self.logger.info(f"Link selection completed (fallback) in {total_time:.2f}s")
        return selected_link