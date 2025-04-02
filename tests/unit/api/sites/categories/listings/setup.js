// Mock for useSiteMetrics hook
const useSiteMetrics = jest.fn().mockReturnValue({
  metrics: {
    totalSites: 10,
    activeSites: 8,
    totalListings: 100,
    activeListings: 80,
    totalCategories: 20,
    searchQueries: 500,
    clickThroughRate: 0.25,
    averageSessionDuration: 120
  },
  isLoading: false,
  error: null,
  refetch: jest.fn()
});

// Mock for other hooks
const useAuth = jest.fn().mockReturnValue({
  user: { id: 'test-user', name: 'Test User', email: 'test@example.com', role: 'admin' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn()
});

// Mock hooks directly
jest.mock('@/hooks/useSiteMetrics', () => ({
  __esModule: true,
  useSiteMetrics,
  default: useSiteMetrics
}), { virtual: true });

jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  useAuth,
  default: useAuth
}), { virtual: true });

// Export the mocked hooks for direct access in tests
module.exports = {
  useSiteMetrics,
  useAuth
};