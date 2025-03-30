'use client';

import React, { useEffect, useState } from 'react';
import { Category } from '@/types';
import { CategoryForm } from '../CategoryForm';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSlug: string;
  categoryId?: string;
  onSaved?: (categoryId: string) => void;
  title?: string;
}

/**
 * Modal component for category form that can be used for both create and edit operations
 */
export function CategoryFormModal({
  isOpen,
  onClose,
  siteSlug,
  categoryId,
  onSaved,
  title
}: CategoryFormModalProps) {
  const [categoryData, setCategoryData] = useState<Partial<Category> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!categoryId;
  
  // Default title based on mode
  const modalTitle = title || (isEditMode ? 'Edit Category' : 'Create New Category');
  
  // Fetch category data if in edit mode
  useEffect(() => {
    if (isOpen && isEditMode && categoryId) {
      const fetchCategoryData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await fetch(`/api/sites/${siteSlug}/categories/${categoryId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch category: ${response.statusText}`);
          }
          
          const data = await response.json();
          setCategoryData(data);
        } catch (err) {
          console.error('Error fetching category:', err);
          setError(err instanceof Error ? err.message : 'Failed to load category data');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCategoryData();
    } else if (!isEditMode) {
      // Reset data in create mode
      setCategoryData(undefined);
    }
  }, [isOpen, isEditMode, categoryId, siteSlug]);
  
  // Close modal when ESC key is pressed
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Handle modal closing - reset state
  const handleClose = () => {
    onClose();
  };
  
  // Handle successful save
  const handleSaved = (id: string) => {
    if (onSaved) {
      onSaved(id);
    }
    onClose();
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={modalTitle}
      role="dialog"
      aria-modal="true"
      data-testid="category-form-modal"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onClick={handleClose}
        data-testid="category-form-modal-backdrop"
      ></div>
      
      {/* Modal content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto z-10"
          onClick={(e) => e.stopPropagation()}
          data-testid="category-form-modal-content"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800" data-testid="category-form-modal-title">
              {modalTitle}
            </h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={handleClose}
              aria-label="Close"
              data-testid="category-form-modal-close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8" data-testid="category-form-modal-loading">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md" data-testid="category-form-modal-error">
                <p className="text-red-700">{error}</p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            ) : (
              <CategoryForm
                siteSlug={siteSlug}
                categoryId={categoryId}
                initialData={categoryData}
                onCancel={handleClose}
                onSaved={handleSaved}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryFormModal;
