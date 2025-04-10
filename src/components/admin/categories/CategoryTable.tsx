'use client';

import React from 'react';
import { CategoryTable as NewCategoryTable } from './table/CategoryTable';
import { CategoryTableProps } from './types';

/**
 * CategoryTable Component
 *
 * This component displays a table of categories with actions to view, edit, and delete categories.
 * It has been refactored to use a container/presentation pattern with multiple specialized components,
 * each with their own concerns and hooks.
 *
 * Features:
 * - Hierarchical view of categories
 * - Sorting and filtering
 * - Pagination
 * - CRUD operations
 * - Responsive design (table and card views)
 * - Loading states with skeletons
 * - Error handling with retry options
 */
export function CategoryTable({ siteSlug, initialCategories }: CategoryTableProps) {
  return (
    <NewCategoryTable
      siteSlug={siteSlug}
      initialCategories={initialCategories}
    />
  );
}

// Also export as default for backward compatibility
export default CategoryTable;
