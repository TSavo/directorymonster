'use client';

import React from 'react';
import { CategoryTableProps } from './types';
import { useCategoryTable } from './hooks/useCategoryTable';
import {
  CategoryTableError,
  CategoryTableSkeleton,
  CategoryTableEmptyState,
  CategoryTableHeader,
  CategoryTablePagination,
  CategoriesMobileView,
  DeleteConfirmationModal,
  CategoryErrorBoundary,
  CategoryFormModal,
  CategoryTableContainer,
  CategoryTableColumns,
  CategoryHierarchyManager
} from './components';

/**
 * Main category management table component
 */
export function CategoryTable({ siteSlug, initialCategories }: CategoryTableProps) {
  // Use the hook for table state and logic
  const {
    // Category data
    categories,
    filteredCategories,
    currentCategories,
    allCategories,
    sites,

    // Loading and error states
    isLoading,
    error,

    // Filtering
    searchTerm,
    setSearchTerm,
    parentFilter,
    setParentFilter,
    siteFilter,
    setSiteFilter,

    // Sorting
    sortField,
    sortOrder,
    handleSort,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    goToPage,

    // UI state
    showHierarchy,
    formModalOpen,
    selectedCategoryId,
    showSiteColumn,
    viewMode,
    toggleViewMode,

    // Delete handling
    isDeleteModalOpen,
    categoryToDelete,
    confirmDelete,
    handleDelete,
    cancelDelete,

    // UI actions
    toggleHierarchy,
    handleEditCategory,
    handleCreateCategory,
    handleCloseFormModal,
    handleCategorySaved,
    handleViewCategory,

    // Data operations
    fetchCategories
  } = useCategoryTable(siteSlug, initialCategories);

  // Reload categories if there's an error
  const handleRetry = () => {
    fetchCategories();
  };

  // Loading state
  if (isLoading) {
    return <CategoryTableSkeleton data-testid="category-table-skeleton" />;
  }

  // Error state
  if (error) {
    return <CategoryTableError error={error} onRetry={handleRetry} data-testid="error-message" />;
  }

  // Empty state
  if (categories.length === 0) {
    return <CategoryTableEmptyState siteSlug={siteSlug} onCreateClick={handleCreateCategory} data-testid="category-table-empty" />;
  }

  return (
    <div className="overflow-hidden" data-testid="category-table-content">
      {/* Header with search and filters */}
      <CategoryTableHeader
        totalCategories={filteredCategories.length}
        siteSlug={siteSlug}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        parentFilter={parentFilter}
        setParentFilter={setParentFilter}
        siteFilter={siteFilter}
        setSiteFilter={setSiteFilter}
        categories={allCategories}
        sites={sites}
        onCreateClick={handleCreateCategory}
        onToggleHierarchy={toggleHierarchy}
        showHierarchy={showHierarchy}
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
      />

      {/* Table view */}
      {viewMode === 'table' && (
        <div data-testid="category-table-desktop">
          <CategoryTableContainer>
            <thead className="bg-gray-50">
              <CategoryTableColumns
                showSiteColumn={showSiteColumn}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <CategoryErrorBoundary
                fallback={
                  <tr>
                    <td colSpan={showSiteColumn ? 5 : 4} className="px-4 py-3 text-center text-red-500">
                      Error rendering category hierarchy. Please try disabling hierarchy view or contact support.
                    </td>
                  </tr>
                }
              >
                <CategoryHierarchyManager
                  currentCategories={currentCategories}
                  showHierarchy={showHierarchy}
                  showSiteColumn={showSiteColumn}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onDeleteClick={confirmDelete}
                  onEditClick={handleEditCategory}
                  onViewClick={handleViewCategory}
                />
              </CategoryErrorBoundary>
            </tbody>
          </CategoryTableContainer>
        </div>
      )}

      {/* Card view */}
      {viewMode === 'card' && (
        <CategoriesMobileView
          categories={currentCategories}
          showSiteColumn={showSiteColumn}
          onDeleteClick={confirmDelete}
          siteSlug={siteSlug}
          onEditClick={handleEditCategory}
          onViewClick={handleViewCategory}
          data-testid="category-table-mobile"
        />
      )}

      {/* Pagination */}
      <CategoryTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        goToPage={goToPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalItems={filteredCategories.length}
        data-testid="category-table-pagination"
      />

      {/* Delete confirmation modal */}
      {categoryToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Delete Category"
          itemName={categoryToDelete.name}
          onConfirm={() => handleDelete(categoryToDelete.id)}
          onCancel={cancelDelete}
          data-testid="category-delete-modal"
        />
      )}

      {/* Category form modal */}
      <CategoryFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        siteSlug={siteSlug || ''}
        categoryId={selectedCategoryId}
        onSaved={handleCategorySaved}
        title={selectedCategoryId ? 'Edit Category' : 'Create New Category'}
      />
    </div>
  );
}

// Also export as default for backward compatibility
export default CategoryTable;
