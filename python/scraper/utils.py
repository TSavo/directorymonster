"""
Utility Functions
Common utilities for the scraper
"""
import logging
import os
import re
import time
import random
from urllib.parse import urlparse
import sys


def setup_logging(log_level=logging.INFO, log_file=None):
    """
    Set up logging configuration with Unicode error handling.
    
    Args:
        log_level: Logging level
        log_file: Optional log file path
    """
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add Unicode-safe console handler
    console_handler = UnicodeConsoleHandler()
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Add file handler if specified
    if log_file:
        # Create directory if it doesn't exist
        log_dir = os.path.dirname(log_file)
        if log_dir:  # Only try to create directory if there is one
            os.makedirs(log_dir, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)


class UnicodeConsoleHandler(logging.StreamHandler):
    """A handler that safely handles Unicode characters in console output."""
    
    def __init__(self):
        super().__init__(sys.stdout)
    
    def emit(self, record):
        try:
            msg = self.format(record)
            # Replace problematic Unicode characters with '?'
            msg = self._sanitize_unicode(msg)
            self.stream.write(msg + self.terminator)
            self.flush()
        except Exception:
            self.handleError(record)
    
    def _sanitize_unicode(self, text):
        """Sanitize Unicode text for console output."""
        if isinstance(text, str):
            # Replace emojis and other problematic characters
            return text.encode('ascii', 'replace').decode('ascii')
        return str(text)


def extract_domain(url):
    """
    Extract domain from URL.
    
    Args:
        url (str): Full URL
        
    Returns:
        str: Domain name
    """
    try:
        parsed_uri = urlparse(url)
        domain = parsed_uri.netloc
        
        # Remove www. if present
        if domain.startswith('www.'):
            domain = domain[4:]
            
        return domain
    except Exception:
        # Fallback for malformed URLs
        try:
            if '//' in url:
                domain = url.split('//')[1].split('/')[0]
            else:
                domain = url.split('/')[0]
                
            if domain.startswith('www.'):
                domain = domain[4:]
                
            return domain
        except Exception:
            return url


def generate_slug(text):
    """
    Generate a URL-friendly slug from text.
    
    Args:
        text (str): Text to convert to slug
        
    Returns:
        str: URL-friendly slug
    """
    if not text:
        return ""
        
    # Convert to lowercase
    slug = text.lower()
    
    # Remove special characters
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    
    # Remove consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Trim hyphens from ends
    slug = slug.strip('-')
    
    return slug


def random_delay(min_seconds=1, max_seconds=3):
    """
    Pause execution for a random amount of time.
    
    Args:
        min_seconds (float): Minimum delay in seconds
        max_seconds (float): Maximum delay in seconds
    """
    delay = random.uniform(min_seconds, max_seconds)
    time.sleep(delay)


def sanitize_filename(filename):
    """
    Sanitize a string for use as a filename.
    
    Args:
        filename (str): Filename to sanitize
        
    Returns:
        str: Sanitized filename
    """
    # Replace problematic characters
    sanitized = re.sub(r'[\\/*?:"<>|]', '_', filename)
    
    # Limit length
    if len(sanitized) > 100:
        sanitized = sanitized[:97] + '...'
        
    return sanitized


def sanitize_text(text):
    """
    Sanitize text by removing or replacing problematic characters.
    
    Args:
        text (str): Text to sanitize
        
    Returns:
        str: Sanitized text
    """
    if not text:
        return ""
        
    # Replace emojis and other non-ASCII characters
    sanitized = text.encode('ascii', 'replace').decode('ascii')
    
    return sanitized