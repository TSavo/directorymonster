/**
 * Homepage selectors
 * 
 * This file contains all selectors used for homepage tests.
 * Using a centralized selector approach makes tests more maintainable
 * as UI changes only require updates in one place.
 */

export const HomepageSelectors = {
  // Main page elements
  page: {
    header: '[data-testid="site-header"]',
    logo: '[data-testid="site-logo"]',
    navigation: '[data-testid="site-navigation"]',
    heroSection: '[data-testid="hero-section"]',
    categorySection: '[data-testid="category-section"]',
    footer: '[data-testid="site-footer"]',
    copyright: '[data-testid="copyright"]',
  },
  
  // Search-related elements
  search: {
    form: '[data-testid="search-form"]',
    input: '[data-testid="search-input"]', 
    results: '[data-testid="search-results"]',
  },
  
  // Mobile-specific elements
  mobile: {
    menuButton: '[data-testid="mobile-menu-button"]',
    menuContent: '[data-testid="mobile-menu-content"]',
  },

  // Fallback selectors (used when data-testid isn't available)
  fallback: {
    header: 'header, .header, .site-header',
    navigation: 'nav, .navigation, .nav, .menu',
    footer: 'footer, .footer, .site-footer',
    search: 'input[type="search"], form input, input[placeholder*="search" i], input[placeholder*="find" i]',
  }
};
