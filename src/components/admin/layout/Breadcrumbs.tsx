'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from './icons';

interface BreadcrumbsProps {
  pathname: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ pathname }) => {
  // Skip if we're on the admin root
  if (pathname === '/admin') {
    return null;
  }
  
  // Build breadcrumb items
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Create breadcrumb items with links and labels
  const breadcrumbItems = pathSegments.map((segment, index) => {
    // Build the href for this breadcrumb
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    
    // Format the label (capitalize first letter and replace hyphens with spaces)
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    
    return { href, label };
  });
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link 
            href="/admin"
            className="text-gray-500 hover:text-gray-700"
          >
            Admin
          </Link>
        </li>
        
        {breadcrumbItems.slice(1).map((item, index) => (
          <li key={item.href} className="flex items-center">
            <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-gray-400" />
            <Link
              href={item.href}
              className={`ml-2 text-sm font-medium ${
                index === breadcrumbItems.length - 2
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={index === breadcrumbItems.length - 2 ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};