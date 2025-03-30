'use client';

import React from 'react';

export interface ThemePreviewProps {
  /**
   * Site theme
   */
  theme: string;
  customStyles?: string;
}

/**
 * ThemePreview - Preview site theme settings
 */
export const ThemePreview: React.FC<ThemePreviewProps> = ({
  theme,
  customStyles
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium border-b pb-2 mb-2">Appearance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Theme</p>
          <p className="mt-1 capitalize" data-testid="preview-theme">{theme}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-600">Custom CSS</p>
          {customStyles ? (
            <div 
              className="mt-1 p-3 bg-gray-50 font-mono text-xs overflow-auto max-h-32 rounded"
              data-testid="preview-custom-styles"
            >
              <pre>{customStyles}</pre>
            </div>
          ) : (
            <p className="text-gray-400 italic">No custom CSS</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;