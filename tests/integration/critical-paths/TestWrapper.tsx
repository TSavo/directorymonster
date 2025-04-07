import React, { ReactNode } from 'react';
import { mockRouter } from './setup';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the router context
const RouterContext = React.createContext({});

// Mock the PublicTenantSiteContext
jest.mock('@/contexts/PublicTenantSiteContext', () => ({
  usePublicTenantSite: () => ({
    tenants: [
      { id: 'tenant-1', name: 'Test Tenant' },
      { id: 'tenant-2', name: 'Another Tenant' },
    ],
    sites: [
      { id: 'site-1', name: 'Test Site', slug: 'test-site' },
      { id: 'site-2', name: 'Another Site', slug: 'another-site' },
    ],
    currentTenantId: 'tenant-1',
    currentSiteId: 'site-1',
    setCurrentTenantId: jest.fn(),
    setCurrentSiteId: jest.fn(),
  }),
  PublicTenantSiteProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock the AuthContext
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'user-1', name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null,
  }),
}));

// Mock the UnifiedAuthComponent
jest.mock('@/components/auth', () => ({
  UnifiedAuthComponent: () => <div data-testid="auth-component">Auth Component</div>,
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src || ''} alt={props.alt || ''} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown Icon</div>,
  Search: () => <div data-testid="search-icon">Search Icon</div>,
  Moon: () => <div data-testid="moon-icon">Moon Icon</div>,
  Sun: () => <div data-testid="sun-icon">Sun Icon</div>,
  Filter: () => <div data-testid="filter-icon">Filter Icon</div>,
  User: () => <div data-testid="user-icon">User Icon</div>,
  Shield: () => <div data-testid="shield-icon">Shield Icon</div>,
  Globe: () => <div data-testid="globe-icon">Globe Icon</div>,
  FileText: () => <div data-testid="file-text-icon">FileText Icon</div>,
  RefreshCw: () => <div data-testid="refresh-cw-icon">RefreshCw Icon</div>,
}));

// Test wrapper component
interface TestWrapperProps {
  children: ReactNode;
  router?: typeof mockRouter;
}

export const TestWrapper = ({ children, router = mockRouter }: TestWrapperProps) => {
  return (
    <RouterContext.Provider value={router as any}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </RouterContext.Provider>
  );
};

// Custom render function
export const renderWithWrapper = (ui: React.ReactElement, options = {}) => {
  return {
    ...render(ui, {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      ...options,
    }),
  };
};
