"use client";

import React from 'react';
import { ListingFormData } from '../../../types';
import { TextInput } from './TextInput';

interface BacklinkStepProps {
  formData: ListingFormData;
  errors: Record<string, any>;
  updateNestedField: <
    K extends keyof ListingFormData,
    NK extends keyof NonNullable<ListingFormData[K]>
  >(parentField: K, nestedField: NK, value: any) => void;
  isSubmitting: boolean;
}

export function BacklinkStep({
  formData,
  errors,
  updateNestedField,
  isSubmitting
}: BacklinkStepProps) {
  // Initialize backlink info if not present
  const backlinkInfo = formData.backlinkInfo || { url: '' };
  
  // Get backlink errors
  const backlinkErrors = errors.backlinkInfo || {};
  
  return (
    <div className="space-y-4" data-testid="listing-form-backlink">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Backlink Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Provide a backlink to your website to improve your listing visibility
        </p>
      </div>
      
      <TextInput
        id="backlink-url"
        label="Backlink URL"
        value={backlinkInfo.url || ''}
        onChange={(value) => updateNestedField('backlinkInfo', 'url', value)}
        error={backlinkErrors.url}
        disabled={isSubmitting}
        required
        placeholder="https://example.com"
        data-testid="backlink-url-input"
      />
      
      <TextInput
        id="backlink-anchor-text"
        label="Anchor Text"
        value={backlinkInfo.anchorText || ''}
        onChange={(value) => updateNestedField('backlinkInfo', 'anchorText', value)}
        error={backlinkErrors.anchorText}
        disabled={isSubmitting}
        placeholder="Visit our website"
        data-testid="backlink-anchor-text-input"
      />
    </div>
  );
}

export default BacklinkStep;
