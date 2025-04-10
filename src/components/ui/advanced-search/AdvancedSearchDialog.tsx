"use client";

import React from 'react';
import { AdvancedSearchContainer } from './AdvancedSearchContainer';

export interface AdvancedSearchDialogProps {
  children?: React.ReactNode;
  searchPath?: string;
  triggerButtonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  triggerButtonSize?: 'default' | 'sm' | 'lg';
  triggerButtonClassName?: string;
  dialogClassName?: string;
}

/**
 * Advanced Search Dialog Component
 *
 * This component provides a dialog for advanced search functionality with filters.
 * It has been refactored to use a container/presentation pattern for better testability.
 */
export function AdvancedSearchDialog({
  children,
  searchPath = '/admin/search',
  triggerButtonVariant = 'outline',
  triggerButtonSize = 'sm',
  triggerButtonClassName,
  dialogClassName
}: AdvancedSearchDialogProps) {
  return (
    <AdvancedSearchContainer
      children={children}
      searchPath={searchPath}
      triggerButtonVariant={triggerButtonVariant}
      triggerButtonSize={triggerButtonSize}
      triggerButtonClassName={triggerButtonClassName}
      dialogClassName={dialogClassName}
    />
  );
}
