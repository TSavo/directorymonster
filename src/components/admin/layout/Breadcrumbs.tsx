'use client';

import React from 'react';
import { BreadcrumbsContainer } from './BreadcrumbsContainer';

interface BreadcrumbsProps {
  pathname: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  return <BreadcrumbsContainer {...props} />;
};

// Also export as default for backward compatibility
export default Breadcrumbs;