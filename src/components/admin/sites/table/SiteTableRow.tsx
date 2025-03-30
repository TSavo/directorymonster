'use client';

import React from 'react';
import Link from 'next/link';

export interface SiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domains: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface SiteTableRowProps {
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
 * SiteTableRow - Row component for the site table
 * 
 * Displays a single site with actions
 */
export const SiteTableRow: React.FC<SiteTableRowProps> = ({
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
    <tr className="hover:bg-gray-50" data-testid={`site-row-${site.id}`}>
      <td className="py-3 px-4 border-b">
        <div className="font-medium text-gray-900" data-testid={`site-name-${site.id}`}>
          {site.name}
        </div>
        {site.description && (
          <div className="text-sm text-gray-500 truncate max-w-xs" data-testid={`site-description-${site.id}`}>
            {site.description}
          </div>
        )}
      </td>
      
      <td className="py-3 px-4 border-b">
        <span className="text-gray-700" data-testid={`site-slug-${site.id}`}>
          {site.slug}
        </span>
      </td>
      
      <td className="py-3 px-4 border-b">
        <div className="max-h-24 overflow-y-auto">
          {site.domains.length > 0 ? (
            <ul className="text-sm">
              {site.domains.map((domain, index) => (
                <li key={domain} data-testid={`site-domain-${index}-${site.id}`}>
                  {domain}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500 italic">No domains</span>
          )}
        </div>
      </td>
      
      <td className="py-3 px-4 border-b text-gray-700" data-testid={`site-created-${site.id}`}>
        {formatDate(site.createdAt)}
      </td>
      
      <td className="py-3 px-4 border-b">
        <div className="flex justify-center space-x-2">
          <Link 
            href={`/admin/sites/${site.id}`}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Site"
            data-testid={`view-site-${site.id}`}
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
            data-testid={`edit-site-${site.id}`}
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
            data-testid={`delete-site-${site.id}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="sr-only">Delete Site</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SiteTableRow;