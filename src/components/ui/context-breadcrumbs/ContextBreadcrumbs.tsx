"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Users, Shield, Globe, FileText, FolderTree, Settings } from 'lucide-react';
import { useBreadcrumbs, BreadcrumbItem } from './BreadcrumbProvider';

interface ContextBreadcrumbsProps {
  className?: string;
}

export function ContextBreadcrumbs({ className = '' }: ContextBreadcrumbsProps) {
  const { items } = useBreadcrumbs();

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center text-sm text-muted-foreground ${className}`}>
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" data-testid="breadcrumb-separator" />
            )}

            <BreadcrumbLink item={item} isLast={index === items.length - 1} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbLinkProps {
  item: BreadcrumbItem;
  isLast: boolean;
}

function BreadcrumbLink({ item, isLast }: BreadcrumbLinkProps) {
  const Icon = getIconForPath(item.href, item.icon);

  return (
    <div className="flex items-center">
      {Icon && <Icon className="h-4 w-4 mr-1" data-testid="breadcrumb-icon" />}

      {isLast ? (
        <span className="font-medium text-foreground">{item.label}</span>
      ) : (
        <Link
          href={item.href}
          className="hover:text-foreground transition-colors"
        >
          {item.label}
        </Link>
      )}
    </div>
  );
}

function getIconForPath(path: string, customIcon?: React.ReactNode): React.ComponentType<any> | undefined {
  if (customIcon) {
    return () => <>{customIcon}</>;
  }

  if (path === '/admin') {
    return Home;
  }

  if (path.includes('/users')) {
    return Users;
  }

  if (path.includes('/roles')) {
    return Shield;
  }

  if (path.includes('/sites')) {
    return Globe;
  }

  if (path.includes('/listings') || path.includes('/content')) {
    return FileText;
  }

  if (path.includes('/categories')) {
    return FolderTree;
  }

  if (path.includes('/settings')) {
    return Settings;
  }

  return undefined;
}
