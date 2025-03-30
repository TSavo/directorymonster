'use client';

import React from 'react';

interface UserSiteAssociationsProps {
  selectedSiteIds: string[];
  sites: { id: string; name: string }[];
  onChange: (name: string, value: any) => void;
  error?: string;
}

export function UserSiteAssociations({
  selectedSiteIds,
  sites,
  onChange,
  error
}: UserSiteAssociationsProps) {
  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    
    onChange('siteIds', values);
  };
  
  return (
    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
      <h2 className="text-lg font-medium mb-4">Site Associations</h2>
      
      <div>
        <label htmlFor="siteIds" className="block text-sm font-medium text-gray-700">
          Associated Sites
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Hold Ctrl/Cmd to select multiple sites
        </p>
        <select
          id="siteIds"
          name="siteIds"
          multiple
          value={selectedSiteIds}
          onChange={handleSiteChange}
          className={`mt-1 block w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} shadow-sm p-2 h-32`}
          data-testid="sites-input"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600" data-testid="sites-error">{error}</p>
        )}
      </div>
    </div>
  );
}

export default UserSiteAssociations;
