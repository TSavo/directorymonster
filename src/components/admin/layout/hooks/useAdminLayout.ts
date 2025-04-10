'use client';

import { ReactNode, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface UseAdminLayoutProps {
  children: ReactNode;
}

export interface UseAdminLayoutReturn {
  children: ReactNode;
  sidebarOpen: boolean;
  pathname: string;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export function useAdminLayout({ children }: UseAdminLayoutProps): UseAdminLayoutReturn {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prevState => !prevState);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return {
    children,
    sidebarOpen,
    pathname,
    toggleSidebar,
    closeSidebar
  };
}

export default useAdminLayout;
