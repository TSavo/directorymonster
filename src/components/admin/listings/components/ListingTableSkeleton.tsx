'use client';

import { ListingTableSkeletonProps } from '../types';

/**
 * Loading skeleton for the listing table
 */
export function ListingTableSkeleton({ rows = 5 }: ListingTableSkeletonProps) {
  return (
    <div className="w-full p-4" aria-busy="true" role="status" aria-live="polite">
      <div className="flex justify-between items-center mb-4">
        <div className="h-7 w-40 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>
      
      {/* Filters skeleton */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-full sm:w-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 p-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`header-${index}`} className="h-6 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={`row-${index}`} className="p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-5 w-full md:w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="mt-4 flex justify-between items-center">
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-8 w-40 bg-gray-200 animate-pulse rounded"></div>
      </div>
      
      {/* Screen reader text */}
      <div className="sr-only">Loading listings data, please wait...</div>
    </div>
  );
}
