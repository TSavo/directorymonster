'use client';

import React, { ReactNode } from 'react';
import MainHeader from './MainHeader';
import MainFooter from './MainFooter';
import { PublicTenantSiteProvider } from '@/contexts/PublicTenantSiteContext';
import { AuthProvider } from '@/components/admin/auth/AuthProvider';

interface MainLayoutProps {
  children: ReactNode;
  site: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export default function MainLayout({ children, site, categories = [] }: MainLayoutProps) {
  return (
    <AuthProvider>
      <PublicTenantSiteProvider>
        <div className="flex flex-col min-h-screen">
          <MainHeader site={site} categories={categories} />
          <main className="flex-grow">
            {children}
          </main>
          <MainFooter site={site} />
        </div>
      </PublicTenantSiteProvider>
    </AuthProvider>
  );
}
