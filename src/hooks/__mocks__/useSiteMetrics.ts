// Mock implementation of useSiteMetrics hook
export const useSiteMetrics = jest.fn().mockReturnValue({
  siteMetrics: {
    totalListings: 100,
    totalCategories: 10,
    totalUsers: 5,
    recentActivity: []
  },
  isLoading: false,
  error: null
});

export default useSiteMetrics;
