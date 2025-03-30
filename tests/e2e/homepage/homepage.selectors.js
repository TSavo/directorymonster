/**
 * @file Homepage selectors
 * @description Centralized selectors for homepage E2E tests
 */

const HomepageSelectors = {
  // Main page elements
  header: '[data-testid="site-header"]',
  logo: '[data-testid="site-logo"]',
  navigation: '[data-testid="site-navigation"]',
  heroSection: '[data-testid="hero-section"]',
  categorySection: '[data-testid="category-section"]',
  footer: '[data-testid="site-footer"]',
  copyright: '[data-testid="copyright"]',
  
  // Search-related elements
  search: {
    form: '[data-testid="search-form"]',
    input: '[data-testid="search-input"]',
    results: '[data-testid="search-results"]'
  },
  
  // Mobile-specific elements
  mobile: {
    menuButton: '[data-testid="mobile-menu-button"], .hamburger, .mobile-menu-button, button[aria-label*="menu"]',
    menuContent: '[data-testid="mobile-menu-content"], .mobile-menu, .mobile-navigation'
  },
  
  // Fallback selectors (when data-testid isn't available)
  fallback: {
    header: 'header, .header, .site-header',
    navigation: 'nav, .navigation, .nav, .menu',
    footer: 'footer, .footer, .site-footer',
    search: 'input[type="search"], form input, input[placeholder*="search" i], input[placeholder*="find" i]',
    links: 'a'
  }
};

module.exports = HomepageSelectors;
