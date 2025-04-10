'use client';

import React from 'react';
import { TenantSiteProvider } from '@/contexts/TenantSiteContext';
import { BreadcrumbProvider } from '@/components/ui/context-breadcrumbs';
import { useAdminLayout, UseAdminLayoutProps } from './hooks/useAdminLayout';
import { AdminLayoutPresentation } from './AdminLayoutPresentation';

export function AdminLayoutContainer(props: UseAdminLayoutProps) {
  const layoutProps = useAdminLayout(props);
  
  return (
    <TenantSiteProvider>
      <BreadcrumbProvider>
        <AdminLayoutPresentation 
          children={layoutProps.children}
          sidebarOpen={layoutProps.sidebarOpen}
          toggleSidebar={layoutProps.toggleSidebar}
          closeSidebar={layoutProps.closeSidebar}
        />
      </BreadcrumbProvider>
    </TenantSiteProvider>
  );
}

export default AdminLayoutContainer;
