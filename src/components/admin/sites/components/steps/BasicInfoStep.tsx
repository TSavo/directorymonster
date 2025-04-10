'use client';

import React, { useCallback } from 'react';
import FormField from '@/components/admin/sites/components/common/FormField';
import { useSiteForm } from '@/components/admin/sites/context/SiteFormContext';
import { Button } from '@/components/ui/Button';

/**
 * BasicInfoStep - First step in the site creation/editing process
 *
 * Collects basic information about the site: name, slug, and description.
 */
export const BasicInfoStep: React.FC = () => {
  const { state, updateField } = useSiteForm();
  const { formData, errors } = state;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateField(name, value);
  }, [updateField]);

  const generateSlug = useCallback(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      updateField('slug', slug);
    }
  }, [formData.name, updateField]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basic Information</h2>

      <FormField
        id="site-name"
        label="Site Name"
        name="name"
        value={formData.name || ''}
        onChange={handleChange}
        error={errors.name}
        required
        helpText="The name of your site as it will appear to users"
      />

      <div className="flex items-end gap-4">
        <div className="flex-grow">
          <FormField
            id="site-slug"
            label="Site Slug"
            name="slug"
            value={formData.slug || ''}
            onChange={handleChange}
            error={errors.slug}
            required
            helpText="Used in URLs and API calls (e.g., my-site)"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={generateSlug}
          className="mb-4"
          data-testid="generate-slug-button"
        >
          Generate
        </Button>
      </div>

      <FormField
        id="site-description"
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={handleChange}
        error={errors.description}
        type="textarea"
        rows={4}
        helpText="A brief description of your site (optional)"
      />
    </div>
  );
};

export default BasicInfoStep;
