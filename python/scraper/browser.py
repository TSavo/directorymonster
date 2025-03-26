"""
Browser Management Component
Handles browser initialization, configuration, and lifecycle management
"""
import logging
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait


class BrowserManager:
    """Manages browser lifecycle and configuration."""
    
    def __init__(self, headless=True, timeout=10):
        """
        Initialize a browser manager.
        
        Args:
            headless (bool): Whether to run in headless mode
            timeout (int): Default wait timeout in seconds
        """
        self.logger = logging.getLogger("browser")
        self.timeout = timeout
        self.setup_browser(headless)
    
    def setup_browser(self, headless=True):
        """
        Set up and configure the browser.
        
        Args:
            headless (bool): Whether to run in headless mode
        """
        chrome_options = Options()
        
        if headless:
            # Essential headless options
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Additional options to ensure stability
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920x1080")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-infobars")
        chrome_options.add_argument("--disable-notifications")
        
        # Set user agent to avoid being detected as a bot
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36")
        
        self.logger.info("Initializing Chrome browser")
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, self.timeout)
        
        # Set page load timeout
        self.driver.set_page_load_timeout(30)
    
    def navigate_to(self, url, timeout=None):
        """
        Navigate to a URL with error handling.
        
        Args:
            url (str): URL to navigate to
            timeout (int): Timeout in seconds
            
        Returns:
            bool: Success status
        """
        if timeout is None:
            timeout = self.timeout
            
        try:
            self.logger.info(f"Navigating to: {url}")
            self.driver.set_page_load_timeout(timeout)
            self.driver.get(url)
            time.sleep(2)  # Brief delay for page stabilization
            return True
            
        except Exception as e:
            self.logger.error(f"Navigation error: {str(e)}")
            try:
                self.driver.execute_script("window.stop();")
            except:
                pass
            return False
    
    def reset(self):
        """Reset the browser session."""
        self.logger.info("Resetting browser session")
        try:
            self.driver.quit()
        except:
            pass
            
        time.sleep(2)
        self.setup_browser()
    
    def close(self):
        """Close the browser and clean up."""
        self.logger.info("Closing browser")
        try:
            self.driver.quit()
        except Exception as e:
            self.logger.error(f"Error closing browser: {str(e)}")