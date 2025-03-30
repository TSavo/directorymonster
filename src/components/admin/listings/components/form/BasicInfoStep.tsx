"use client";

import React from 'react';
import { ListingFormData, ListingStatus } from '../../types';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { SelectField } from './SelectField';

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
  const statusOptions = [
    { value: ListingStatus.DRAFT, label: 'Draft' },
    { value: ListingStatus.PUBLISHED, label: 'Published' },
    { value: ListingStatus.PENDING_REVIEW, label: 'Pending Review' },
    { value: ListingStatus.ARCHIVED, label: 'Archived' }
  ];
  
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
    </div>
  );
}

export default BasicInfoStep;
