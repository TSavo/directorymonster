'use client';

import React from 'react';
import { CategoryTableContainerProps } from '../types';

/**
 * Container component for the category table
 */
export function CategoryTableContainer({ 
  children, 
  testId = 'category-table-desktop' 
}: CategoryTableContainerProps) {
  return (
    <div className="hidden md:block overflow-x-auto shadow rounded-lg" data-testid={testId}>
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  );
}

export default CategoryTableContainer;
