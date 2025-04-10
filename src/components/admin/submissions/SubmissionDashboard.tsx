"use client";

import React, { useState } from 'react';
import { SubmissionTable } from './SubmissionTable';
import { SubmissionFilter } from './SubmissionFilter';
import { SubmissionFilters } from '@/types/submission';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';

interface SubmissionDashboardProps {
  siteSlug?: string;
}

export function SubmissionDashboard({ siteSlug }: SubmissionDashboardProps) {
  const [filters, setFilters] = useState<SubmissionFilters>({});
  
  // Fetch categories for the filter
  const { categories, isLoading: categoriesLoading } = useCategories({
    siteSlug,
    autoFetch: true
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: SubmissionFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
      </div>
      
      <SubmissionFilter 
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        categories={categoriesLoading ? [] : categories.map(cat => ({ 
          id: cat.id, 
          name: cat.name 
        }))}
      />
      
      <SubmissionTable 
        siteSlug={siteSlug}
        filter={filters}
      />
    </div>
  );
}

export default SubmissionDashboard;
