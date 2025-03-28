'use client';

import Link from 'next/link';
import { CategoryWithRelations } from '../types';

/**
 * Mobile-friendly view of categories that replaces the table for smaller screens
 */
export default function CategoriesMobileView({ 
  categories, 
  showSiteColumn, 
  onDeleteClick,
  siteSlug 
}: {
  categories: CategoryWithRelations[];
  showSiteColumn: boolean;
  onDeleteClick: (id: string, name: string) => void;
  siteSlug?: string;
}) {
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="md:hidden space-y-4">
      {categories.map((category) => (
        <article key={category.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            {category.childCount > 0 && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {category.childCount}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
            {category.parentName && (
              <>
                <div>Parent:</div>
                <div>{category.parentName}</div>
              </>
            )}
            
            <div>Order:</div>
            <div>{category.order}</div>
            
            {showSiteColumn && (
              <>
                <div>Site:</div>
                <div>{category.siteName}</div>
              </>
            )}
            
            <div>Last Updated:</div>
            <div>{formatDate(category.updatedAt)}</div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Link 
              href={siteSlug ? `/admin/sites/${siteSlug}/categories/${category.slug}` : `/admin/categories/${category.id}`}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              View
            </Link>
            <Link 
              href={siteSlug ? `/admin/sites/${siteSlug}/categories/${category.id}/edit` : `/admin/categories/${category.id}/edit`}
              className="text-amber-600 hover:text-amber-900 text-sm font-medium"
            >
              Edit
            </Link>
            <button
              onClick={() => onDeleteClick(category.id, category.name)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
