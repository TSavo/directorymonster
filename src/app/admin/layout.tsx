import { ReactNode } from 'react';
import { AdminLayout, WithAuth } from '@/components/admin';

interface AdminRootLayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <WithAuth>
      <AdminLayout>
        {children}
      </AdminLayout>
    </WithAuth>
  );
}