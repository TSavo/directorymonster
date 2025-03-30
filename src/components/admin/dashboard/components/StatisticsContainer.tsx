"use client";

import React from 'react';
import { SiteMetricsData } from '../types';

interface StatisticsContainerProps {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  gridLayout?: 'default' | 'wide' | 'narrow';
}

export function StatisticsContainer({
  children,
  className = '',
  isLoading = false,
  gridLayout = 'default',
}: StatisticsContainerProps) {
  // Determine grid layout
  let gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  
  if (gridLayout === 'wide') {
    gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';
  } else if (gridLayout === 'narrow') {
    gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2';
  }

  return (
    <div
      data-testid="statistics-container"
      className={`grid ${gridClass} gap-4 ${className}`}
      aria-label="Site statistics"
      aria-busy={isLoading ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}

export default StatisticsContainer;