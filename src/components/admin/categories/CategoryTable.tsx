'use client';

import React, { useState } from 'react';
import { useCategories } from './hooks';
import { CategoryWithRelations } from './types';
import {
  CategoryTableError,
  CategoryTableSkeleton,
  CategoryTableEmptyState,
  CategoryTableHeader,
  CategoryTableRow,
  CategoryTableSortHeader,
  CategoryTablePagination,
  CategoriesMobileView,
  DeleteConfirmationModal,
  CategoryErrorBoundary
} from './components';

export interface CategoryTableProps {
  siteSlug?: string;
  initialCategories?: CategoryWithRelations[];
}

export default function CategoryTable({ siteSlug, initialCategories }: CategoryTableProps) {
  const [showHierarchy, setShowHierarchy] = useState(false);
  
  // Use the categories hook for state management
  const {
    categories,
    filteredCategories,
    currentCategories,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    parentFilter,
    setParentFilter,
    siteFilter,
    setSiteFilter,
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    goToPage,
    isDeleteModalOpen,
    categoryToDelete,
    confirmDelete,
    handleDelete,
    cancelDelete,
    fetchCategories,
    allCategories,
    sites
  } = useCategories(siteSlug, initialCategories);

  // Handle showing hierarchy view
  const toggleHierarchy = () => {
    setShowHierarchy(!showHierarchy);
  };

  // Reload categories if there's an error
  const handleRetry = () => {
    fetchCategories();
  };

  // Determine if the site column should be visible (multi-tenant mode)
  const showSiteColumn = !siteSlug && sites.length > 0;

  // Safe hierarchy construction with memo to prevent recomputation
  const safeHierarchy = React.useMemo(() => {
    // Create a map of child categories by parent ID for hierarchy view
    const childrenMap = new Map<string, CategoryWithRelations[]>();
    
    if (showHierarchy) {
      // First pass: Create the map of child categories by parent ID
      currentCategories.forEach(category => {
        if (category.parentId) {
          if (!childrenMap.has(category.parentId)) {
            childrenMap.set(category.parentId, []);
          }
          // Create a shallow copy to avoid modifying the original
          childrenMap.get(category.parentId)?.push({...category});
        }
      });
      
      // Second pass: Validate no circular references exist
      const validateNoCircularReferences = (categoryId: string, ancestorIds: Set<string> = new Set()): boolean => {
        if (ancestorIds.has(categoryId)) {
          console.error(`Circular reference detected for category ${categoryId}`);
          return false;
        }
        
        const newAncestorIds = new Set(ancestorIds);
        newAncestorIds.add(categoryId);
        
        const children = childrenMap.get(categoryId) || [];
        return children.every(child => validateNoCircularReferences(child.id, newAncestorIds));
      };
      
      // Get all root categories and validate their hierarchies
      const rootCategories = currentCategories.filter(c => !c.parentId);
      rootCategories.forEach(root => validateNoCircularReferences(root.id));
    }
    
    return {
      // Get only the root categories (no parent ID)
      rootCategories: currentCategories.filter(c => !c.parentId),
      childrenMap
    };
  }, [currentCategories, showHierarchy]);

  // Improved hierarchy rendering without circular references
  const renderHierarchicalRows = (parentCategories: CategoryWithRelations[], depth = 0) => {
    return parentCategories.flatMap((category, index, arr) => {
      const isLastChild = index === arr.length - 1;
      const children = safeHierarchy.childrenMap.get(category.id) || [];
      
      // Only get direct children, not full subtree to prevent circular references
      return [
        <CategoryTableRow 
          key={category.id}
          category={category}
          showSiteColumn={showSiteColumn}
          onDeleteClick={confirmDelete}
          depth={depth}
          isLastChild={isLastChild}
          isDraggable={true}
          isSortedBy={sortField}
          sortDirection={sortOrder}
        />,
        // Render children recursively but without circular references
        ...renderHierarchicalRows(children, depth + 1)
      ];
    });
  };

  // Loading state
  if (isLoading) {
    return <CategoryTableSkeleton />;
  }

  // Error state
  if (error) {
    return <CategoryTableError error={error} onRetry={handleRetry} />;
  }

  // Empty state
  if (categories.length === 0) {
    return <CategoryTableEmptyState siteSlug={siteSlug} />;
  }

  return (
    <div className="overflow-hidden">
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
      />
      
      {/* Table for desktop */}
      <div className="hidden md:block overflow-x-auto shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <CategoryTableSortHeader
                label="Order"
                field="order"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <CategoryTableSortHeader
                label="Name"
                field="name"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              {showSiteColumn && (
                <th 
                  scope="col" 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Site
                </th>
              )}
              <CategoryTableSortHeader
                label="Last Updated"
                field="updatedAt"
                currentSortField={sortField}
                currentSortOrder={sortOrder}
                onSort={handleSort}
              />
              <th 
                scope="col" 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
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
              {showHierarchy
                ? renderHierarchicalRows(safeHierarchy.rootCategories)
                : currentCategories.map(category => (
                    <CategoryTableRow
                      key={category.id}
                      category={category}
                      showSiteColumn={showSiteColumn}
                      onDeleteClick={confirmDelete}
                      isDraggable={true}
                      isSortedBy={sortField}
                      sortDirection={sortOrder}
                    />
                  ))
              }
            </CategoryErrorBoundary>
          </tbody>
        </table>
      </div>
      
      {/* Mobile view */}
      <CategoriesMobileView
        categories={currentCategories}
        showSiteColumn={showSiteColumn}
        onDeleteClick={confirmDelete}
        siteSlug={siteSlug}
      />
      
      {/* Pagination */}
      <CategoryTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        goToPage={goToPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalItems={filteredCategories.length}
      />
      
      {/* Delete confirmation modal */}
      {categoryToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Delete Category"
          itemName={categoryToDelete.name}
          onConfirm={() => handleDelete(categoryToDelete.id)}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}