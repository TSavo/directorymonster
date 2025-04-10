import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RoleWizardContainer } from '@/components/admin/roles/wizard/RoleWizardContainer';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create Role | Admin Dashboard',
  description: 'Create a new role with the role setup wizard',
};

export default function RoleWizardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Role</h1>
            <p className="text-muted-foreground">
              Use this wizard to create a new role with permissions
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/roles" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
        </div>
        
        <RoleWizardContainer />
      </div>
    </AdminLayout>
  );
}
