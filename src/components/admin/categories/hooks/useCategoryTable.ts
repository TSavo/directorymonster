'use client';

import { useState, useCallback } from 'react';
import { useCategories } from './useCategories';
import { CategoryWithRelations } from '../types';

/**
 * Custom hook for managing CategoryTable UI state and interactions
 */
export function useCategoryTable(siteSlug?: string, initialCategories?: CategoryWithRelations[]) {
  // UI state
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  
  // Use the categories hook for data management
  const categoriesState = useCategories(siteSlug, initialCategories);
  
  // Handle showing hierarchy view
  const toggleHierarchy = useCallback(() => {
    setShowHierarchy(prev => !prev);
  }, []);

  // Handle opening the form modal for editing
  const handleEditCategory = useCallback((id: string) => {
    setSelectedCategoryId(id);
    setFormModalOpen(true);
  }, []);

  // Handle opening the form modal for creating a new category
  const handleCreateCategory = useCallback(() => {
    setSelectedCategoryId(undefined);
    setFormModalOpen(true);
  }, []);

  // Handle closing the form modal
  const handleCloseFormModal = useCallback(() => {
    setFormModalOpen(false);
    setSelectedCategoryId(undefined);
  }, []);

  // Handle successful category save
  const handleCategorySaved = useCallback((id: string) => {
    categoriesState.fetchCategories();
    setFormModalOpen(false);
    setSelectedCategoryId(undefined);
  }, [categoriesState]);

  // Handle view category
  const handleViewCategory = useCallback((id: string) => {
    // Implement view functionality
    // Could navigate to the category page or toggle a view mode
    console.log(`View category: ${id}`);
  }, []);
  
  // Determine if the site column should be visible (multi-tenant mode)
  const showSiteColumn = !siteSlug && categoriesState.sites.length > 0;
  
  return {
    // UI state
    showHierarchy,
    formModalOpen,
    selectedCategoryId,
    showSiteColumn,
    
    // Categories state from useCategories
    ...categoriesState,
    
    // UI actions
    toggleHierarchy,
    handleEditCategory,
    handleCreateCategory,
    handleCloseFormModal,
    handleCategorySaved,
    handleViewCategory
  };
}

export default useCategoryTable;
