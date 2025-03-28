'use client';

// This is a placeholder for the CategoryTable component
// It will be implemented after the tests are in place

import { CategoryTableProps } from './types';

export default function CategoryTable({ siteSlug, initialCategories }: CategoryTableProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Categories</h2>
      <p className="text-gray-500">
        This component will display a list of categories with full management capabilities.
      </p>
    </div>
  );
}
