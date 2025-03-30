export interface StatisticCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  subtitle?: string;
  onRefresh?: () => void;
}

export interface ActivityItem {
  id: string;
  type: 'creation' | 'update' | 'deletion' | 'publication' | 'import';
  entityType: 'listing' | 'category' | 'site' | 'user' | 'comment';
  entityId: string;
  entityName: string;
  timestamp: string;
  userId: string;
  userName: string;
  details?: string;
}

export interface ActivityFeedProps {
  siteSlug?: string;
  limit?: number;
  filter?: {
    entityType?: ActivityItem['entityType'][];
    actionType?: ActivityItem['type'][];
    userId?: string;
  };
  showHeader?: boolean;
  className?: string;
  isLoading?: boolean;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface PerformanceChartProps {
  title: string;
  data: ChartDataPoint[];
  metricName: string;
  metricKey: string;
  periodSelector?: boolean;
  comparisonEnabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export interface PerformanceMetricsData {
  pageViews: ChartDataPoint[];
  uniqueVisitors: ChartDataPoint[];
  searchVolume: ChartDataPoint[];
  listingViews: ChartDataPoint[];
  // Add more metrics as needed
}

export interface SiteMetricsData {
  id: string;
  siteId: string;
  listings: {
    total: number;
    published: number;
    draft: number;
    featured: number;
    change: {
      total: number;
      isPositive: boolean;
    };
  };
  categories: {
    total: number;
    active: number;
    change: {
      total: number;
      isPositive: boolean;
    };
  };
  traffic: {
    pageViews: number;
    uniqueVisitors: number;
    averageTimeOnSite: number;
    bounceRate: number;
    change: {
      pageViews: number;
      uniqueVisitors: number;
      isPositive: boolean;
    };
  };
  search: {
    totalSearches: number;
    avgSearchesPerVisitor: number;
    topSearchTerms: Array<{
      term: string;
      count: number;
    }>;
    change: {
      searches: number;
      isPositive: boolean;
    };
  };
  interactions: {
    clicks: number;
    shares: number;
    saves: number;
    change: {
      total: number;
      isPositive: boolean;
    };
  };
}

export interface StatisticCardsProps {
  siteSlug?: string;
  metrics?: SiteMetricsData;
  showSearchMetrics?: boolean;
  showInteractionMetrics?: boolean;
  isLoading?: boolean;
  className?: string;
}

export interface UseSiteMetricsParams {
  siteSlug: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface UseSiteMetricsResult {
  metrics: SiteMetricsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseActivityFeedParams {
  siteSlug?: string;
  limit?: number;
  filter?: {
    entityType?: ActivityItem['entityType'][];
    actionType?: ActivityItem['type'][];
    userId?: string;
  };
}

export interface UseActivityFeedResult {
  activities: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UsePerformanceMetricsParams {
  siteSlug: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  metrics?: Array<keyof PerformanceMetricsData>;
}

export interface UsePerformanceMetricsResult {
  data: PerformanceMetricsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setPeriod: (period: UsePerformanceMetricsParams['period']) => void;
  setDateRange: (startDate: string, endDate: string) => void;
}
