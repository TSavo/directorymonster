'use client';

import React, { ReactNode } from 'react';
import { AdminLayoutContainer } from './AdminLayoutContainer';

export interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = (props) => {
  return <AdminLayoutContainer {...props} />;
};

export default AdminLayout;