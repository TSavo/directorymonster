'use client';

import { CategoriesMobileViewProps } from '../types';

/**
 * Mobile-friendly view of categories that replaces the table for smaller screens
 */
export function CategoriesMobileView({
  categories,
  showSiteColumn,
  onDeleteClick,
  onEditClick,
  onViewClick,
  siteSlug,
  'data-testid': dataTestId = 'categories-mobile-view'
}: CategoriesMobileViewProps) {
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="md:hidden space-y-4" data-testid={dataTestId}>
      {categories.map((category) => (
        <article
          key={category.id}
          className="border rounded-lg p-4 space-y-3"
          data-testid={`category-card-${category.id}`}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900" data-testid={`category-name-${category.id}`}>
              {category.name}
            </h3>
            {category.childCount > 0 && (
              <div
                className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                data-testid={`child-count-${category.id}`}
              >
                {category.childCount}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
            {category.parentName && (
              <>
                <div data-testid="parent-label">Parent:</div>
                <div data-testid={`parent-name-${category.id}`}>{category.parentName}</div>
              </>
            )}

            <div>Order:</div>
            <div data-testid={`order-value-${category.id}`}>{category.order}</div>

            {showSiteColumn && (
              <>
                <div data-testid="site-label">Site:</div>
                <div data-testid={`site-name-${category.id}`}>{category.siteName}</div>
              </>
            )}

            <div>Last Updated:</div>
            <div data-testid={`updated-date-${category.id}`}>{formatDate(category.updatedAt)}</div>
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button
              onClick={() => onViewClick(category.id)}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              data-testid={`view-button-${category.id}`}
            >
              View
            </button>
            <button
              onClick={() => onEditClick(category.id)}
              className="text-amber-600 hover:text-amber-900 text-sm font-medium"
              data-testid={`edit-button-${category.id}`}
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteClick(category.id, category.name)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
              data-testid={`delete-button-${category.id}`}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

// Also export as default for backward compatibility
export default CategoriesMobileView;
