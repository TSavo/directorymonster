'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  PlusCircle,
  Search,
  User,
  Users,
  Shield,
  Globe,
  FileText,
  FolderTree,
  Settings,
  BarChart,
  Bell,
  LogOut,
  HelpCircle,
  Zap
} from 'lucide-react';

export interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  href?: string;
  action?: () => void;
  context?: string[];
}

export interface UseQuickActionsOptions {
  customActions?: QuickAction[];
  initialOpen?: boolean;
}

export interface UseQuickActionsResult {
  open: boolean;
  setOpen: (open: boolean) => void;
  filteredActions: QuickAction[];
  handleSelect: (action: QuickAction) => void;
  currentContext: string;
}

// Default quick actions data
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-user',
    name: 'Create User',
    description: 'Add a new user to the system',
    icon: <User className="h-4 w-4" />,
    href: '/admin/users/new',
    context: ['users', 'dashboard']
  },
  {
    id: 'create-role',
    name: 'Create Role',
    description: 'Create a new role with permissions',
    icon: <Shield className="h-4 w-4" />,
    href: '/admin/roles/wizard',
    context: ['roles', 'dashboard']
  },
  {
    id: 'create-site',
    name: 'Create Site',
    description: 'Add a new site to the tenant',
    icon: <Globe className="h-4 w-4" />,
    href: '/admin/sites/new',
    context: ['sites', 'dashboard']
  },
  {
    id: 'create-listing',
    name: 'Create Listing',
    description: 'Add a new listing',
    icon: <FileText className="h-4 w-4" />,
    href: '/admin/listings/new',
    context: ['listings', 'dashboard']
  },
  {
    id: 'create-category',
    name: 'Create Category',
    description: 'Add a new content category',
    icon: <FolderTree className="h-4 w-4" />,
    href: '/admin/categories/new',
    context: ['categories', 'dashboard']
  },
  {
    id: 'compare-permissions',
    name: 'Compare Permissions',
    description: 'Compare permissions between roles',
    icon: <Shield className="h-4 w-4" />,
    href: '/admin/permissions/compare',
    context: ['roles']
  },
  {
    id: 'view-users',
    name: 'View All Users',
    description: 'See all users in the system',
    icon: <Users className="h-4 w-4" />,
    href: '/admin/users',
  },
  {
    id: 'view-analytics',
    name: 'View Analytics',
    description: 'See system analytics and metrics',
    icon: <BarChart className="h-4 w-4" />,
    href: '/admin/analytics',
  },
  {
    id: 'view-notifications',
    name: 'View Notifications',
    description: 'See your notifications',
    icon: <Bell className="h-4 w-4" />,
    href: '/admin/notifications',
  },
  {
    id: 'advanced-search',
    name: 'Advanced Search',
    description: 'Search across all content',
    icon: <Search className="h-4 w-4" />,
    href: '/admin/search',
    shortcut: '⌘F'
  },
  {
    id: 'help',
    name: 'Help & Documentation',
    description: 'View help documentation',
    icon: <HelpCircle className="h-4 w-4" />,
    href: '/admin/help',
  },
  {
    id: 'logout',
    name: 'Log Out',
    description: 'Sign out of your account',
    icon: <LogOut className="h-4 w-4" />,
    href: '/auth/logout',
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

export function useQuickActions({
  customActions,
  initialOpen = false
}: UseQuickActionsOptions = {}): UseQuickActionsResult {
  const [open, setOpen] = useState(initialOpen);
  const router = useRouter();
  const pathname = usePathname();

  // Determine current context based on pathname
  const currentContext = getContextFromPathname(pathname);

  // Use custom actions if provided, otherwise use default actions
  const actions = customActions || DEFAULT_QUICK_ACTIONS;

  // Filter actions based on current context
  const filteredActions = actions.filter(action => {
    // If no context specified, show in all contexts
    if (!action.context || action.context.length === 0) {
      return true;
    }

    // Show if action's context includes current context
    return action.context.includes(currentContext);
  });

  // Handle action selection
  const handleSelect = useCallback((action: QuickAction) => {
    setOpen(false);

    if (action.href) {
      router.push(action.href);
    } else if (action.action) {
      action.action();
    }
  }, [router]);

  return {
    open,
    setOpen,
    filteredActions,
    handleSelect,
    currentContext
  };
}
