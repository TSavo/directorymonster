import { QuickAction, UseQuickActionsResult } from '../useQuickActions';

// Mock actions without JSX
const MOCK_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-user',
    name: 'Create User',
    description: 'Add a new user to the system',
    icon: 'user-icon',
    href: '/admin/users/new',
    context: ['users', 'dashboard']
  },
  {
    id: 'view-users',
    name: 'View All Users',
    description: 'See all users in the system',
    icon: 'users-icon',
    href: '/admin/users',
  },
  {
    id: 'advanced-search',
    name: 'Advanced Search',
    description: 'Search across all content',
    icon: 'search-icon',
    href: '/admin/search',
    shortcut: '⌘F'
  }
];

// Helper function to determine context from pathname
export function getContextFromPathname(pathname: string): string {
  if (pathname.includes('/users')) return 'users';
  if (pathname.includes('/roles')) return 'roles';
  if (pathname.includes('/sites')) return 'sites';
  if (pathname.includes('/listings')) return 'listings';
  if (pathname.includes('/categories')) return 'categories';
  if (pathname.includes('/settings')) return 'settings';

  return 'dashboard';
}

// Mock implementation of useQuickActions
export function useQuickActions({ 
  customActions,
  initialOpen = false
} = {}): UseQuickActionsResult {
  const mockSetOpen = jest.fn();
  const mockHandleSelect = jest.fn();
  
  return {
    open: initialOpen,
    setOpen: mockSetOpen,
    filteredActions: customActions || MOCK_QUICK_ACTIONS.filter(action => {
      if (!action.context || action.context.length === 0) {
        return true;
      }
      return action.context.includes('users');
    }),
    handleSelect: mockHandleSelect,
    currentContext: 'users'
  };
}
