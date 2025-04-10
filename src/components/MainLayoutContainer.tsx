'use client';

import React from 'react';
import { PublicTenantSiteProvider } from '@/contexts/PublicTenantSiteContext';
import { AuthProvider } from '@/components/admin/auth/AuthProvider';
import { useMainLayout, UseMainLayoutProps } from './hooks/useMainLayout';
import { MainLayoutPresentation } from './MainLayoutPresentation';

export function MainLayoutContainer(props: UseMainLayoutProps) {
  const layoutProps = useMainLayout(props);
  
  return (
    <AuthProvider>
      <PublicTenantSiteProvider>
        <MainLayoutPresentation {...layoutProps} />
      </PublicTenantSiteProvider>
    </AuthProvider>
  );
}

export default MainLayoutContainer;
