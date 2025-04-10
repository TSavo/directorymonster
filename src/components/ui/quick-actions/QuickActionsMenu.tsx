"use client";

import React from 'react';
import { QuickActionsContainer } from './QuickActionsContainer';

interface QuickActionsMenuProps {
  className?: string;
}

/**
 * QuickActionsMenu Component
 *
 * This component provides a menu of quick actions that are contextually relevant
 * based on the current page. It has been refactored to use a container/presentation
 * pattern for better testability.
 */
export function QuickActionsMenu({ className = '' }: QuickActionsMenuProps) {
  return <QuickActionsContainer className={className} />;
}
