'use client';

import React from 'react';

export interface BasicInfoPreviewProps {
  /**
   * Site basic information
   */
  name: string;
  slug: string;
  description?: string;
}

/**
 * BasicInfoPreview - Preview basic site information
 */
export const BasicInfoPreview: React.FC<BasicInfoPreviewProps> = ({
  name,
  slug,
  description
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium border-b pb-2 mb-2">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Site Name</p>
          <p className="mt-1" data-testid="preview-name">{name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Slug</p>
          <p className="mt-1 font-mono text-sm" data-testid="preview-slug">{slug}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-600">Description</p>
          <p className="mt-1" data-testid="preview-description">
            {description || <span className="text-gray-400 italic">No description provided</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoPreview;