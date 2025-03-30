'use client';

import React, { useMemo } from 'react';
import { CategoryWithRelations, SortField, SortOrder } from '../types';
import { CategoryTableRow } from './CategoryTableRow';

interface CategoryHierarchyManagerProps {
  currentCategories: CategoryWithRelations[];
  showHierarchy: boolean;
  showSiteColumn: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onDeleteClick: (id: string, name: string) => void;
  onEditClick: (id: string) => void;
  onViewClick: (id: string) => void;
}

/**
 * Component to handle hierarchical display of categories
 */
export function CategoryHierarchyManager({
  currentCategories,
  showHierarchy,
  showSiteColumn,
  sortField,
  sortOrder,
  onDeleteClick,
  onEditClick,
  onViewClick
}: CategoryHierarchyManagerProps) {
  
  // Safe hierarchy construction with memo to prevent recomputation
  const safeHierarchy = useMemo(() => {
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

  // Render hierarchical rows recursively with proper indentation
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
          onDeleteClick={onDeleteClick}
          depth={depth}
          isLastChild={isLastChild}
          isDraggable={true}
          isSortedBy={sortField}
          sortDirection={sortOrder}
          onEditClick={onEditClick}
          onViewClick={onViewClick}
        />,
        // Render children recursively but without circular references
        ...renderHierarchicalRows(children, depth + 1)
      ];
    });
  };

  if (showHierarchy) {
    return <>{renderHierarchicalRows(safeHierarchy.rootCategories)}</>;
  }
  
  return (
    <>
      {currentCategories.map(category => (
        <CategoryTableRow
          key={category.id}
          category={category}
          showSiteColumn={showSiteColumn}
          onDeleteClick={onDeleteClick}
          isDraggable={true}
          isSortedBy={sortField}
          sortDirection={sortOrder}
          onEditClick={onEditClick}
          onViewClick={onViewClick}
        />
      ))}
    </>
  );
}

export default CategoryHierarchyManager;
