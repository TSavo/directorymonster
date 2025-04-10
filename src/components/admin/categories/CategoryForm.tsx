'use client';

import React from 'react';
import { CategoryFormProps } from './components/form/types';
import { CategoryFormContainer } from './CategoryFormContainer';

/**
 * Category form component for creating and editing categories
 */
export function CategoryForm(props: CategoryFormProps) {
  return <CategoryFormContainer {...props} />;
}

// Also export as default for backward compatibility
export default CategoryForm;
