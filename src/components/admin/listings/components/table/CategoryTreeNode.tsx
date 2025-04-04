import React from 'react';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import { FolderIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '@/components/admin/listings/types';

interface CategoryTreeNodeProps {
  category: Category;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
  category,
  depth,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelectCategory,
}) => {
  const hasChildren = category.children && category.children.length > 0;

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
              onToggleExpand(category.id);
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
            onCheckedChange={() => onSelectCategory(category.id)}
            className="mr-2"
            data-testid={`category-filter-${category.id}`}
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
          {category.children?.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              isExpanded={false}
              isSelected={isSelected}
              onToggleExpand={onToggleExpand}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeNode;
