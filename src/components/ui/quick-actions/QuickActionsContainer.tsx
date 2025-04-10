'use client';

import React from 'react';
import { useQuickActions, UseQuickActionsOptions, QuickAction } from './hooks/useQuickActions';
import { QuickActionsPresentation } from './QuickActionsPresentation';

export interface QuickActionsContainerProps extends UseQuickActionsOptions {
  className?: string;
  buttonLabel?: string;
  heading?: string;
  emptyMessage?: string;
  actionsHook?: typeof useQuickActions;
}

export function QuickActionsContainer({
  customActions,
  initialOpen,
  className,
  buttonLabel,
  heading,
  emptyMessage,
  actionsHook = useQuickActions
}: QuickActionsContainerProps) {
  // Use the quick actions hook
  const {
    open,
    setOpen,
    filteredActions,
    handleSelect
  } = actionsHook({
    customActions,
    initialOpen
  });

  // Render the presentation component
  return (
    <QuickActionsPresentation
      open={open}
      setOpen={setOpen}
      filteredActions={filteredActions}
      handleSelect={handleSelect}
      className={className}
      buttonLabel={buttonLabel}
      heading={heading}
      emptyMessage={emptyMessage}
    />
  );
}
