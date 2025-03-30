/**
 * @file Admin Dashboard selectors
 * @description Centralized selectors for admin dashboard E2E tests
 */

const AdminDashboardSelectors = {
  // Main dashboard elements
  dashboard: {
    container: '[data-testid="admin-dashboard"]',
    header: '[data-testid="admin-header"]',
    sidebar: '[data-testid="admin-sidebar"]',
    content: '[data-testid="admin-content"]',
    heading: 'h1[data-testid="dashboard-heading"]',
    subheading: 'h2[data-testid="dashboard-subheading"]'
  },
  
  // Navigation elements
  navigation: {
    container: '[data-testid="admin-navigation"]',
    items: '[data-testid="nav-item"]',
    activeItem: '[data-testid="nav-item"].active, [data-testid="nav-item"][aria-current="page"]',
    logo: '[data-testid="admin-logo"]',
    toggle: '[data-testid="sidebar-toggle"]',
    userMenu: '[data-testid="user-menu"]'
  },
  
  // Statistics section
  statistics: {
    container: '[data-testid="statistics-container"]',
    cards: '[data-testid="statistic-card"]',
    values: '[data-testid="statistic-value"]',
    labels: '[data-testid="statistic-label"]',
    icons: '[data-testid="statistic-icon"]'
  },
  
  // Activity feed section
  activityFeed: {
    container: '[data-testid="activity-feed"]',
    heading: '[data-testid="activity-feed-heading"]',
    content: '[data-testid="activity-feed-content"]',
    items: '[data-testid="activity-item"]',
    emptyState: '[data-testid="activity-feed-empty"]',
    loadMore: '[data-testid="load-more-activities"]'
  },
  
  // Quick actions section (if present)
  quickActions: {
    container: '[data-testid="quick-actions"]',
    buttons: '[data-testid="action-button"]'
  },
  
  // Mobile-specific elements
  mobile: {
    menuButton: '[data-testid="mobile-menu-button"]',
    menuContent: '[data-testid="mobile-menu-content"]',
    sidebarCollapsed: '[data-testid="sidebar-collapsed"]'
  },
  
  // Fallback selectors (when data-testid isn't available)
  fallback: {
    dashboard: '.admin-dashboard, .dashboard, main.admin, #admin-dashboard',
    header: 'header, .header, .admin-header',
    sidebar: 'aside, nav, .sidebar, .admin-sidebar',
    navigation: 'nav, .navigation, .nav-menu, .admin-nav',
    content: 'main, .content, .admin-content, .dashboard-content',
    statisticCards: '.statistic-card, .stat-card, .metric-card, .dashboard-stat',
    activityFeed: '.activity-feed, .feed, .timeline, .recent-activity',
    activityItems: '.activity-item, .feed-item, .timeline-item, li',
    userMenu: '.user-menu, .profile-menu, .account-menu',
    heading: 'h1, .page-title, .dashboard-title'
  }
};

module.exports = AdminDashboardSelectors;