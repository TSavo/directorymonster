# Admin Dashboard Components

This directory contains components for the main admin dashboard in the DirectoryMonster application.

## Component Structure

The dashboard follows a modular architecture pattern:

```
src/components/admin/dashboard/
├── AdminDashboard.tsx          # Main dashboard container
├── index.ts                    # Main exports
├── components/                 # Dashboard components
│   ├── MetricsOverview.tsx     # Key metrics display
│   ├── RecentActivity.tsx      # Activity feed component
│   ├── QuickActions.tsx        # Common actions shortcuts
│   ├── SiteSelector.tsx        # Site switching interface
│   ├── StatusCards.tsx         # Status card grid
│   ├── LatestListings.tsx      # Recent listings table
│   ├── CategoryDistribution.tsx # Category visualization
│   ├── PerformanceMetrics.tsx  # Performance charts
│   └── index.ts                # Component exports
├── hooks/                      # Data hooks
│   ├── index.ts                # Hook exports
│   ├── useDashboardData.ts     # Dashboard data hook
│   └── useSiteMetrics.ts       # Site metrics hook
└── types.ts                    # Type definitions
```

## Usage

### AdminDashboard

The AdminDashboard component displays an overview of site data and provides quick access to common tasks.

```jsx
import AdminDashboard from '@/components/admin/dashboard/AdminDashboard';

export default function DashboardPage({ params }) {
  const { siteSlug } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <AdminDashboard siteSlug={siteSlug} />
    </div>
  );
}
```

## Key Features

1. **Metrics Overview**
   - Display of key site metrics (listings, categories, traffic)
   - Change indicators showing trends
   - Configurable time period selection

2. **Quick Actions**
   - One-click access to common tasks
   - Contextual action suggestions
   - Personalized recommendations

3. **Recent Activity**
   - Chronological activity feed
   - Filterable by activity type
   - User attribution

4. **Data Visualizations**
   - Category distribution charts
   - Traffic and engagement graphs
   - Conversion metrics visualization

5. **Site Selector**
   - Quick switching between sites
   - Site status indicators
   - Site search functionality

## Component API Reference

### AdminDashboard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteSlug` | `string` | Required | Slug of the site to display dashboard for |
| `timePeriod` | `'day'` \| `'week'` \| `'month'` \| `'year'` | `'week'` | Time period for metrics calculation |
| `apiEndpoint` | `string` | `/api/sites/${siteSlug}/dashboard` | API endpoint for dashboard data |
| `refreshInterval` | `number` | `60000` | Auto-refresh interval in milliseconds (0 to disable) |

### MetricsOverview Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `metrics` | `Metrics` | Required | Metrics data object |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `Error` | `null` | Error state |
| `onRefresh` | `() => void` | - | Callback for manual refresh |

## Data Structure

Dashboard data follows this structure:

```typescript
interface DashboardData {
  metrics: {
    listings: {
      total: number;
      published: number;
      draft: number;
      archived: number;
      change: number; // Percentage change from previous period
    };
    categories: {
      total: number;
      active: number;
      empty: number;
      change: number;
    };
    traffic: {
      visitors: number;
      pageviews: number;
      bounceRate: number;
      change: number;
    };
    engagement: {
      averageDuration: number;
      clickThroughRate: number;
      conversionRate: number;
      change: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'create' | 'update' | 'delete' | 'publish' | 'login' | 'settings';
    entityType: 'listing' | 'category' | 'site' | 'user' | 'settings';
    entityId: string;
    entityName: string;
    userId: string;
    userName: string;
    timestamp: string;
    details?: Record<string, any>;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    count?: number;
    highlight?: boolean;
  }>;
  // Additional data for charts and visualizations
}
```

## Responsive Design

The dashboard components implement a responsive design strategy:

1. **Desktop View (lg and above)**:
   - Multi-column grid layout
   - Detailed charts and visualizations
   - Expanded metric cards

2. **Tablet View (md)**:
   - Two-column grid layout
   - Simplified charts
   - Condensed activity feed

3. **Mobile View (sm and below)**:
   - Single-column layout
   - Essential metrics only
   - Collapsible sections

## Error Handling

The dashboard components implement comprehensive error handling:

1. **Data Fetching Errors**:
   - Fallback UI for failed data fetching
   - Partial data display when possible
   - Retry mechanisms

2. **Visualization Fallbacks**:
   - Graceful degradation for charts
   - Alternative text representations
   - Informative error messages

3. **Loading States**:
   - Skeleton loaders for initial data fetching
   - Progressive content loading
   - Background data refreshing

## Testing Approach

The dashboard components should be tested using the following approach:

1. **Unit Tests**:
   - Test each component in isolation
   - Mock data hooks and API calls
   - Verify UI rendering with different data scenarios

2. **Integration Tests**:
   - Test component interactions
   - Verify data flow between components
   - Test refresh and update behavior

3. **Visual Regression Tests**:
   - Snapshot testing for UI stability
   - Chart rendering verification
   - Responsive layout testing

4. **Accessibility Tests**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast validation

## Future Improvements

Potential enhancements for future iterations:

1. **Customizable Dashboard**:
   - Drag-and-drop widget arrangement
   - User-specific layout persistence
   - Widget library and marketplace

2. **Advanced Analytics**:
   - Predictive trend analysis
   - Comparative benchmarking
   - Export and reporting tools

3. **Notification Center**:
   - Real-time alerts and notifications
   - Notification preferences
   - Action items and tasks

4. **Goal Tracking**:
   - KPI setting and tracking
   - Progress visualization
   - Achievement recognition

5. **AI Insights**:
   - Pattern recognition in site data
   - Automated recommendations
   - Natural language data querying