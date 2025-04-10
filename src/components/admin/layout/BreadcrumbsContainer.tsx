'use client';

import React from 'react';
import { useBreadcrumbs, UseBreadcrumbsProps } from './hooks/useBreadcrumbs';
import { BreadcrumbsPresentation } from './BreadcrumbsPresentation';

export function BreadcrumbsContainer({ pathname }: UseBreadcrumbsProps) {
  const { breadcrumbItems, shouldRender } = useBreadcrumbs({ pathname });
  
  if (!shouldRender) {
    return null;
  }
  
  return <BreadcrumbsPresentation breadcrumbItems={breadcrumbItems} />;
}

export default BreadcrumbsContainer;
