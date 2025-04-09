'use client';

import React from 'react';
import { useDialog, UseDialogProps } from './hooks/useDialog';
import DialogPresentation, { DialogPresentationProps } from './DialogPresentation';

export interface DialogContainerProps extends UseDialogProps, 
  Omit<DialogPresentationProps, 'isOpen' | 'handleOpenChange'> {
}

/**
 * Container component for Dialog
 * 
 * This component connects the useDialog hook with the DialogPresentation component.
 */
export function DialogContainer({
  defaultOpen,
  open,
  onOpenChange,
  trigger,
  asChild,
  children,
  title,
  description,
  footer,
  contentClassName,
  headerClassName,
  footerClassName,
  showCloseButton
}: DialogContainerProps) {
  // Use the dialog hook to manage state
  const {
    isOpen,
    handleOpenChange
  } = useDialog({
    defaultOpen,
    open,
    onOpenChange
  });
  
  // Render the presentation component with the hook values
  return (
    <DialogPresentation
      isOpen={isOpen}
      handleOpenChange={handleOpenChange}
      trigger={trigger}
      asChild={asChild}
      title={title}
      description={description}
      footer={footer}
      contentClassName={contentClassName}
      headerClassName={headerClassName}
      footerClassName={footerClassName}
      showCloseButton={showCloseButton}
    >
      {children}
    </DialogPresentation>
  );
}

export default DialogContainer;
