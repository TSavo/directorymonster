'use client';

import React from 'react';
import Link from 'next/link';
import { SiteData } from './SiteTableRow';

export interface SiteMobileCardProps {
  /**
   * Site data to display
   */
  site: SiteData;
  /**
   * Handler for delete action
   */
  onDelete: (id: string) => void;
}

/**
 * SiteMobileCard - Mobile-optimized card for site display
 * 
 * Responsive alternative to table rows for mobile devices
 */
export const SiteMobileCard: React.FC<SiteMobileCardProps> = ({
  site,
  onDelete
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <div 
      className="bg-white border rounded-lg shadow-sm p-4 mb-3" 
      data-testid={`site-mobile-card-${site.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900" data-testid={`site-mobile-name-${site.id}`}>
          {site.name}
        </h3>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Link 
            href={`/admin/sites/${site.id}`}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Site"
            data-testid={`mobile-view-site-${site.id}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="sr-only">View Site</span>
          </Link>
          
          <Link 
            href={`/admin/sites/${site.id}/edit`}
            className="p-1 text-yellow-600 hover:text-yellow-800"
            title="Edit Site"
            data-testid={`mobile-edit-site-${site.id}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span className="sr-only">Edit Site</span>
          </Link>
          
          <button
            onClick={() => onDelete(site.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Site"
            data-testid={`mobile-delete-site-${site.id}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="sr-only">Delete Site</span>
          </button>
        </div>
      </div>
      
      {/* Site details */}
      <div className="mt-3 space-y-2">
        {site.description && (
          <p className="text-sm text-gray-600" data-testid={`site-mobile-description-${site.id}`}>
            {site.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-500">Slug:</span>
            <span className="ml-2 text-gray-900" data-testid={`site-mobile-slug-${site.id}`}>
              {site.slug}
            </span>
          </div>
          
          <div>
            <span className="font-medium text-gray-500">Created:</span>
            <span className="ml-2 text-gray-900" data-testid={`site-mobile-created-${site.id}`}>
              {formatDate(site.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Domains */}
        <div className="mt-2">
          <h4 className="font-medium text-gray-500 text-sm mb-1">Domains:</h4>
          {site.domains.length > 0 ? (
            <ul className="text-sm space-y-1 text-gray-900">
              {site.domains.map((domain, index) => (
                <li 
                  key={domain} 
                  className="bg-gray-100 inline-block mr-2 mb-2 px-2 py-1 rounded"
                  data-testid={`site-mobile-domain-${index}-${site.id}`}
                >
                  {domain}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500 italic text-sm">No domains</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteMobileCard;