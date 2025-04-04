"use client";

import React, { useEffect, useState } from 'react';
import { ListingFormData, ListingStatus } from '../../types';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { SelectField } from './SelectField';
import { useSites } from '@/components/admin/sites/hooks/useSites';

interface BasicInfoStepProps {
  formData: ListingFormData;
  errors: Record<string, any>;
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  isSubmitting: boolean;
}

export function BasicInfoStep({
  formData,
  errors,
  updateField,
  isSubmitting
}: BasicInfoStepProps) {
  // Get sites from the useSites hook
  const { sites = [], isLoading: sitesLoading = false } = useSites();

  const statusOptions = [
    { value: ListingStatus.DRAFT, label: 'Draft' },
    { value: ListingStatus.PUBLISHED, label: 'Published' },
    { value: ListingStatus.PENDING_REVIEW, label: 'Pending Review' },
    { value: ListingStatus.ARCHIVED, label: 'Archived' }
  ];

  // Convert sites to options for the select field
  const siteOptions = sites.map(site => ({
    value: site.id,
    label: site.name
  }));

  // State for custom fields based on selected site
  const [customFields, setCustomFields] = useState<any[]>([]);

  // Update custom fields when site changes
  useEffect(() => {
    if (formData.siteId) {
      const selectedSite = sites.find(site => site.id === formData.siteId);
      if (selectedSite && selectedSite.customFields) {
        setCustomFields(selectedSite.customFields);
      } else {
        setCustomFields([]);
      }
    } else {
      setCustomFields([]);
    }
  }, [formData.siteId, sites]);

  return (
    <div className="space-y-4" data-testid="listing-form-basic-info">
      <TextInput
        id="listing-title"
        label="Title"
        value={formData.title}
        onChange={(value) => updateField('title', value)}
        error={errors.title}
        disabled={isSubmitting}
        required
        data-testid="listing-title-input"
      />

      <SelectField
        id="listing-site"
        label="Site"
        value={formData.siteId || ''}
        options={siteOptions}
        onChange={(value) => updateField('siteId', value)}
        error={errors.siteId}
        disabled={isSubmitting || sitesLoading}
        required
        data-testid="site-select"
      />

      <SelectField
        id="listing-status"
        label="Status"
        value={formData.status}
        options={statusOptions}
        onChange={(value) => updateField('status', value as ListingStatus)}
        error={errors.status}
        disabled={isSubmitting}
        data-testid="listing-status-select"
      />

      <TextArea
        id="listing-description"
        label="Description"
        value={formData.description}
        onChange={(value) => updateField('description', value)}
        error={errors.description}
        disabled={isSubmitting}
        required
        rows={5}
        data-testid="listing-description-textarea"
      />

      {/* Render custom fields if any */}
      {customFields.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Site-specific Fields</h3>
          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} data-testid={`custom-field-${index + 1}`}>
                <label className="block text-sm font-medium text-gray-700">
                  {field}
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder={`Enter ${field}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BasicInfoStep;
