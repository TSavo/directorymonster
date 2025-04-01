/**
 * Service for retrieving dashboard-related data
 */
export interface DashboardStatsParams {
  tenantId: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
  listings: {
    total: number;
    published: number;
    draft?: number;
    featured?: number;
    change?: {
      total: number;
      isPositive: boolean;
    };
  };
  categories: {
    total: number;
    active: number;
    change?: {
      total: number;
      isPositive: boolean;
    };
  };
  traffic?: {
    pageViews: number;
    uniqueVisitors: number;
    averageTimeOnSite?: number;
    bounceRate?: number;
    change?: {
      pageViews: number;
      uniqueVisitors: number;
      isPositive: boolean;
    };
  };
  search?: {
    totalSearches: number;
    avgSearchesPerVisitor?: number;
    topSearchTerms?: Array<{
      term: string;
      count: number;
    }>;
    change?: {
      searches: number;
      isPositive: boolean;
    };
  };
  interactions?: {
    clicks: number;
    shares?: number;
    saves?: number;
    change?: {
      total: number;
      isPositive: boolean;
    };
  };
}

/**
 * Service for retrieving and managing dashboard data
 */
export class DashboardService {
  /**
   * Get dashboard statistics
   * 
   * @param params Parameters for retrieving stats
   * @returns Dashboard statistics
   */
  static async getStats(params: DashboardStatsParams): Promise<DashboardStats> {
    const { tenantId, period = 'month' } = params;
    
    // In a real implementation, this would query the database or other services
    // For now, return mock data
    return {
      listings: {
        total: 250,
        published: 210,
        draft: 40,
        featured: 15,
        change: {
          total: 12,
          isPositive: true,
        },
      },
      categories: {
        total: 35,
        active: 30,
        change: {
          total: 3,
          isPositive: true,
        },
      },
      traffic: {
        pageViews: 15200,
        uniqueVisitors: 5400,
        averageTimeOnSite: 185, // seconds
        bounceRate: 42.5, // percentage
        change: {
          pageViews: 1200,
          uniqueVisitors: 450,
          isPositive: true,
        },
      },
      search: {
        totalSearches: 3200,
        avgSearchesPerVisitor: 0.6,
        topSearchTerms: [
          { term: 'hiking', count: 320 },
          { term: 'camping', count: 280 },
          { term: 'fishing', count: 210 },
        ],
        change: {
          searches: 300,
          isPositive: true,
        },
      },
      interactions: {
        clicks: 8500,
        shares: 1200,
        saves: 950,
        change: {
          total: 750,
          isPositive: true,
        },
      },
    };
  }
}
