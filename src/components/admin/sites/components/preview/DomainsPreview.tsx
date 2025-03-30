'use client';

import React from 'react';

export interface DomainsPreviewProps {
  /**
   * Site domains
   */
  domains: string[];
}

/**
 * DomainsPreview - Preview site domains
 */
export const DomainsPreview: React.FC<DomainsPreviewProps> = ({
  domains
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium border-b pb-2 mb-2">Domains</h3>
      {domains && domains.length > 0 ? (
        <ul className="list-disc list-inside space-y-1">
          {domains.map((domain, index) => (
            <li key={domain} data-testid={`preview-domain-${index}`}>{domain}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic">No domains configured</p>
      )}
    </div>
  );
};

export default DomainsPreview;