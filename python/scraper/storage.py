"""
Storage Component
Handles saving and loading product data
"""
import os
import json
import logging
from datetime import datetime


class DataStorage:
    """Manages persistence of scraped product data."""
    
    def __init__(self, output_path="/data/products.json"):
        """
        Initialize a data storage manager.
        
        Args:
            output_path (str): Path where to save the data
        """
        self.output_path = output_path
        self.logger = logging.getLogger("storage")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
    
    def save(self, products, path=None):
        """
        Save product data to a JSON file.
        
        Args:
            products (list): List of product data dictionaries
            path (str): Override the default output path
            
        Returns:
            bool: Success status
        """
        if not products:
            self.logger.warning("No products to save")
            return False
            
        save_path = path or self.output_path
        
        try:
            # Create a timestamp for the filename if path doesn't specify one
            if save_path.endswith('.json') and not os.path.exists(save_path):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                self.logger.info(f"Saving {len(products)} products to {save_path}")
            
            # Ensure the directory exists
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            # Write the data
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2, ensure_ascii=False)
                
            self.logger.info(f"Successfully saved {len(products)} products to {save_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error saving products to {save_path}: {str(e)}")
            
            # Try to save to a fallback location
            try:
                fallback_path = f"/tmp/products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(fallback_path, 'w', encoding='utf-8') as f:
                    json.dump(products, f, indent=2, ensure_ascii=False)
                self.logger.info(f"Saved to fallback location: {fallback_path}")
            except Exception as fallback_error:
                self.logger.error(f"Failed to save to fallback location: {str(fallback_error)}")
                
            return False
    
    def load(self, path=None):
        """
        Load product data from a JSON file.
        
        Args:
            path (str): Override the default path
            
        Returns:
            list: List of product data dictionaries or empty list on failure
        """
        load_path = path or self.output_path
        
        try:
            if not os.path.exists(load_path):
                self.logger.warning(f"File does not exist: {load_path}")
                return []
                
            with open(load_path, 'r', encoding='utf-8') as f:
                products = json.load(f)
                
            self.logger.info(f"Loaded {len(products)} products from {load_path}")
            return products
            
        except Exception as e:
            self.logger.error(f"Error loading products from {load_path}: {str(e)}")
            return []
    
    def append(self, new_products, path=None):
        """
        Append new products to an existing file.
        
        Args:
            new_products (list): New product data to append
            path (str): Override the default path
            
        Returns:
            bool: Success status
        """
        if not new_products:
            return True
            
        save_path = path or self.output_path
        
        try:
            # Load existing data
            existing_products = self.load(save_path)
            
            # Append new products
            combined_products = existing_products + new_products
            
            # Save combined data
            return self.save(combined_products, save_path)
            
        except Exception as e:
            self.logger.error(f"Error appending products: {str(e)}")
            return False