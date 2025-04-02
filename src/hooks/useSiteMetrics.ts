// Mock implementation of useSiteMetrics hook
export const useSiteMetrics = () => {
  return {
    siteMetrics: {
      totalListings: 100,
      totalCategories: 10,
      totalUsers: 5,
      recentActivity: []
    },
    isLoading: false,
    error: null
  };
};

export default useSiteMetrics;
