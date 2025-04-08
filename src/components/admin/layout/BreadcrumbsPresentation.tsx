'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from './icons';
import { BreadcrumbItem } from './hooks/useBreadcrumbs';

export interface BreadcrumbsPresentationProps {
  breadcrumbItems: BreadcrumbItem[];
}

export function BreadcrumbsPresentation({ breadcrumbItems }: BreadcrumbsPresentationProps) {
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
                index === breadcrumbItems.slice(1).length - 1
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={index === breadcrumbItems.slice(1).length - 1 ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default BreadcrumbsPresentation;
