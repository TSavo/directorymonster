"""
Scraper Package
Components for web scraping product information
"""
# Update scraper/__init__.py
from scraper.browser import BrowserManager
from scraper.search import SearchEngine 
from scraper.extraction import ProductExtractor  # Make sure this matches the class name in extraction.py
from scraper.storage import DataStorage
from scraper.utils import setup_logging, extract_domain, generate_slug
__all__ = [
    'BrowserManager',
    'SearchEngine',
    'ProductExtractor',
    'DataStorage',
    'setup_logging',
    'extract_domain',
    'generate_slug'
]