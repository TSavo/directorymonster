"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  href?: string;
  action?: () => void;
  context?: string[];
}

interface QuickActionsMenuProps {
  className?: string;
}

export function QuickActionsMenu({ className = '' }: QuickActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine current context based on pathname
  const currentContext = getContextFromPathname(pathname);
  
  // Filter actions based on current context
  const filteredActions = QUICK_ACTIONS.filter(action => {
    // If no context specified, show in all contexts
    if (!action.context || action.context.length === 0) {
      return true;
    }
    
    // Show if action's context includes current context
    return action.context.includes(currentContext);
  });
  
  const handleSelect = (action: QuickAction) => {
    setOpen(false);
    
    if (action.href) {
      router.push(action.href);
    } else if (action.action) {
      action.action();
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-1 ${className}`}
          onClick={() => setOpen(true)}
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Actions</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="end" side="bottom" sideOffset={8} alignOffset={0} forceMount>
        <Command>
          <CommandInput placeholder="Search actions..." />
          <CommandList>
            <CommandEmpty>No actions found.</CommandEmpty>
            <CommandGroup heading="Quick Actions">
              {filteredActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center gap-2 p-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border mr-2">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.name}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  {action.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to determine context from pathname
function getContextFromPathname(pathname: string): string {
  if (pathname.includes('/users')) return 'users';
  if (pathname.includes('/roles')) return 'roles';
  if (pathname.includes('/sites')) return 'sites';
  if (pathname.includes('/listings')) return 'listings';
  if (pathname.includes('/categories')) return 'categories';
  if (pathname.includes('/settings')) return 'settings';
  
  return 'dashboard';
}

// Quick actions data
const QUICK_ACTIONS: QuickAction[] = [
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
