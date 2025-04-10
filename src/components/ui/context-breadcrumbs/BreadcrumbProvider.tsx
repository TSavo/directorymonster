"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface BreadcrumbContextType {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
  addItem: (item: BreadcrumbItem) => void;
  removeItem: (href: string) => void;
  clearItems: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const pathname = usePathname();
  
  // Reset breadcrumbs when path changes
  useEffect(() => {
    generateBreadcrumbsFromPath(pathname);
  }, [pathname]);
  
  const generateBreadcrumbsFromPath = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const newItems: BreadcrumbItem[] = [];
    
    // Always add home
    newItems.push({
      label: 'Dashboard',
      href: '/admin',
      icon: 'home'
    });
    
    let currentPath = '/admin';
    
    // Map known paths to labels
    const pathMap: Record<string, string> = {
      'admin': 'Dashboard',
      'roles': 'Roles',
      'users': 'Users',
      'sites': 'Sites',
      'listings': 'Listings',
      'categories': 'Categories',
      'settings': 'Settings',
      'wizard': 'Create New',
      'permissions': 'Permissions',
      'compare': 'Compare'
    };
    
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      // Skip dynamic segments like [id]
      if (segment.startsWith('[') && segment.endsWith(']')) {
        continue;
      }
      
      // Add segment to breadcrumbs
      newItems.push({
        label: pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath
      });
    }
    
    setItems(newItems);
  };
  
  const addItem = (item: BreadcrumbItem) => {
    setItems(prev => [...prev, item]);
  };
  
  const removeItem = (href: string) => {
    setItems(prev => prev.filter(item => item.href !== href));
  };
  
  const clearItems = () => {
    setItems([]);
  };
  
  return (
    <BreadcrumbContext.Provider
      value={{
        items,
        setItems,
        addItem,
        removeItem,
        clearItems
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  
  if (context === undefined) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  
  return context;
}
