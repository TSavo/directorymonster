'use client';

import { useMemo } from 'react';

export interface BreadcrumbItem {
  href: string;
  label: string;
}

export interface UseBreadcrumbsProps {
  pathname: string;
}

export interface UseBreadcrumbsReturn {
  breadcrumbItems: BreadcrumbItem[];
  shouldRender: boolean;
}

export function useBreadcrumbs({ pathname }: UseBreadcrumbsProps): UseBreadcrumbsReturn {
  // Determine if we should render breadcrumbs
  const shouldRender = pathname !== '/admin';
  
  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    if (!shouldRender) {
      return [];
    }
    
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Create breadcrumb items with links and labels
    return pathSegments.map((segment, index) => {
      // Build the href for this breadcrumb
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      
      // Format the label (capitalize first letter and replace hyphens with spaces)
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      
      return { href, label };
    });
  }, [pathname, shouldRender]);
  
  return {
    breadcrumbItems,
    shouldRender
  };
}

export default useBreadcrumbs;
