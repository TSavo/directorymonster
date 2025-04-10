'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Users, 
  FileText, 
  Settings, 
  List, 
  Tag, 
  Search 
} from 'lucide-react';

interface QuickActionProps {
  siteId?: string;
}

/**
 * Component to display quick action buttons on the admin dashboard
 */
export function QuickActions({ siteId }: QuickActionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quick-actions">
      <ActionCard
        title="New Listing"
        icon={<Plus className="h-5 w-5" />}
        href={siteId ? `/admin/sites/${siteId}/listings/new` : '/admin/listings/new'}
      />
      
      <ActionCard
        title="Manage Users"
        icon={<Users className="h-5 w-5" />}
        href="/admin/users"
      />
      
      <ActionCard
        title="Content"
        icon={<FileText className="h-5 w-5" />}
        href={siteId ? `/admin/sites/${siteId}/content` : '/admin/content'}
      />
      
      <ActionCard
        title="Settings"
        icon={<Settings className="h-5 w-5" />}
        href={siteId ? `/admin/sites/${siteId}/settings` : '/admin/settings'}
      />
      
      <ActionCard
        title="Categories"
        icon={<List className="h-5 w-5" />}
        href={siteId ? `/admin/sites/${siteId}/categories` : '/admin/categories'}
      />
      
      <ActionCard
        title="Tags"
        icon={<Tag className="h-5 w-5" />}
        href={siteId ? `/admin/sites/${siteId}/tags` : '/admin/tags'}
      />
      
      <ActionCard
        title="Search"
        icon={<Search className="h-5 w-5" />}
        href={siteId ? `/admin/sites/${siteId}/search` : '/admin/search'}
      />
    </div>
  );
}

interface ActionCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

function ActionCard({ title, icon, href }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      data-testid={`quick-action-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="p-2 rounded-full bg-primary-100 text-primary-600 mb-2">
        {icon}
      </div>
      <span className="text-sm font-medium text-neutral-900">{title}</span>
    </Link>
  );
}
