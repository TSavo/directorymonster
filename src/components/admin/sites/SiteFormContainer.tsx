'use client';

import React from 'react';
import { useSiteForm, UseSiteFormProps } from './hooks/useSiteForm';
import { SiteFormPresentation } from './SiteFormPresentation';

export interface SiteFormContainerProps extends UseSiteFormProps {
  // Any additional props specific to the container
}

export function SiteFormContainer({
  initialData = {},
  mode = 'create',
  onCancel,
  onSuccess,
  apiEndpoint = '/api/sites',
  initialStep
}: SiteFormContainerProps) {
  const siteFormHook = useSiteForm({
    initialData,
    mode,
    onCancel,
    onSuccess,
    apiEndpoint,
    initialStep
  });

  return (
    <SiteFormPresentation
      {...siteFormHook}
      mode={mode}
      onCancel={onCancel}
    />
  );
}

export default SiteFormContainer;
