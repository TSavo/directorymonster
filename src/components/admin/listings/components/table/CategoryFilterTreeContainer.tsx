import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { CategoryFilterTree } from './CategoryFilterTree';

export const CategoryFilterTreeContainer: React.FC = () => {
  const { categories = [] } = useCategories();
  const { filterByCategory, clearFilters } = useListings();

  // Get the current category filter from the store using memoization
  const categoryFilter = useSelector((state: any) => {
    const categoryId = state.listings?.filters?.categoryId;
    return categoryId ? [categoryId] : [];
  }, (prev, next) => {
    // Compare arrays by value
    if (prev.length !== next.length) return false;
    return prev.length === 0 || prev[0] === next[0];
  });

  // Handle category selection
  const handleCategoryChange = (categoryIds: string[]) => {
    if (categoryIds.length === 0) {
      clearFilters?.();
    } else if (categoryIds.length === 1) {
      filterByCategory?.(categoryIds[0]);
    } else {
      // Handle multiple categories if needed
      filterByCategory?.(categoryIds[0]);
    }
  };



  return (
    <CategoryFilterTree
      categories={categories || []}
      selectedCategoryIds={categoryFilter}
      onChange={handleCategoryChange}
      buttonTestId="category-filter-button"
    />
  );
};

export default CategoryFilterTreeContainer;
