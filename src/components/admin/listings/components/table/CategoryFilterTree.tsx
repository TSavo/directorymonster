import React, { useState } from 'react';
import { Button } from '@/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../ui/dropdown-menu';
import { Category } from '@/components/admin/listings/types';
import { Badge } from '../../../../../ui/badge';
import { Checkbox } from '../../../../../ui/checkbox';
import { FolderIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryFilterTreeProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (categoryIds: string[]) => void;
}

// Recursive function to build the category tree structure
const buildCategoryTree = (categories: Category[], parentId: string | null = null): Category[] => {
  return categories
    .filter(category => category.parentId === parentId)
    .map(category => ({
      ...category,
      children: buildCategoryTree(categories, category.id)
    }));
};

export const CategoryFilterTree: React.FC<CategoryFilterTreeProps> = ({
  categories,
  selectedCategoryIds,
  onChange,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Build category tree
  const categoryTree = buildCategoryTree(categories);

  // Toggle category expansion
  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    let newSelectedIds: string[];

    if (selectedCategoryIds.includes(categoryId)) {
      // Remove this category and all its descendants
      const descendantIds = getDescendantIds(categories, categoryId);
      newSelectedIds = selectedCategoryIds.filter(
        id => id !== categoryId && !descendantIds.includes(id)
      );
    } else {
      // Add this category
      newSelectedIds = [...selectedCategoryIds, categoryId];

      // Check if all siblings are now selected, if so, also select the parent
      const category = categories.find(c => c.id === categoryId);
      if (category?.parentId) {
        const siblings = categories.filter(c => c.parentId === category.parentId);
        const siblingIds = siblings.map(s => s.id);
        const allSiblingsSelected = siblingIds.every(
          id => newSelectedIds.includes(id)
        );

        if (allSiblingsSelected && !newSelectedIds.includes(category.parentId)) {
          newSelectedIds.push(category.parentId);
        }
      }
    }

    onChange(newSelectedIds);
  };

  // Get all descendant category IDs for a given category
  const getDescendantIds = (categories: Category[], categoryId: string): string[] => {
    const directChildren = categories.filter(c => c.parentId === categoryId);
    const childrenIds = directChildren.map(c => c.id);

    const descendantIds = [...childrenIds];
    childrenIds.forEach(childId => {
      descendantIds.push(...getDescendantIds(categories, childId));
    });

    return descendantIds;
  };

  // Recursive render function for category items
  const renderCategoryItem = (category: Category, depth = 0) => {
    const isExpanded = expandedCategories[category.id] || false;
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategoryIds.includes(category.id);

    return (
      <div key={category.id} className="category-item">
        <div
          className={cn(
            "flex items-center py-1 px-2 hover:bg-accent rounded-sm",
            depth > 0 && "ml-4"
          )}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              data-testid={`toggle-category-${category.id}`}
            >
              <ChevronRightIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "transform rotate-90"
                )}
              />
              <span className="sr-only">
                {isExpanded ? "Collapse" : "Expand"}
              </span>
            </Button>
          )}

          {!hasChildren && (
            <div className="w-5 mr-1" />
          )}

          <div className="flex items-center flex-1">
            <Checkbox
              id={`category-${category.id}`}
              checked={isSelected}
              onCheckedChange={() => handleCategoryChange(category.id)}
              className="mr-2"
              data-testid={`category-checkbox-${category.id}`}
            />
            <label
              htmlFor={`category-${category.id}`}
              className="text-sm cursor-pointer flex items-center flex-1"
            >
              {!hasChildren && <FolderIcon className="h-3 w-3 mr-1 text-muted-foreground" />}
              {category.name}
            </label>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children?.map(child => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex"
          data-testid="category-filter-button"
        >
          <span>Categories</span>
          {selectedCategoryIds.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedCategoryIds.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-2 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="py-1">
          {categoryTree.map(category => renderCategoryItem(category))}
        </div>

        {/* Clear Selection Button */}
        {selectedCategoryIds.length > 0 && (
          <div className="pt-2 flex justify-end border-t mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="text-xs h-7"
              data-testid="clear-categories-button"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoryFilterTree;