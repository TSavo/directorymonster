'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryData {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

interface CategoryDistributionProps {
  siteId?: string;
}

/**
 * Component to display category distribution on the admin dashboard
 */
export function CategoryDistribution({ siteId }: CategoryDistributionProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real implementation, this would fetch from the API
        const url = siteId 
          ? `/api/admin/categories/distribution?siteId=${siteId}` 
          : '/api/admin/categories/distribution';
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch category distribution');
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [siteId]);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="categories-loading">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600" data-testid="categories-error">
        Error: {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 text-neutral-600" data-testid="categories-empty">
        No categories available
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="category-distribution" data-site-id={siteId}>
      {categories.map((category) => (
        <div key={category.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-neutral-900">{category.name}</span>
            <span className="text-xs text-neutral-500">{category.count} listings</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full" 
              style={{ width: `${category.percentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-neutral-500 mt-1">
            {category.percentage}%
          </div>
        </div>
      ))}
    </div>
  );
}
