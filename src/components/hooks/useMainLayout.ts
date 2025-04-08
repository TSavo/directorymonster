'use client';

import { ReactNode } from 'react';

export interface Site {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface UseMainLayoutProps {
  children: ReactNode;
  site: Site;
  categories?: Category[];
}

export interface UseMainLayoutReturn {
  site: Site;
  categories: Category[];
  children: ReactNode;
}

export function useMainLayout({
  children,
  site,
  categories = []
}: UseMainLayoutProps): UseMainLayoutReturn {
  return {
    site,
    categories,
    children
  };
}

export default useMainLayout;
