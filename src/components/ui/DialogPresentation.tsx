'use client';

import React from 'react';
import {
  Dialog as RadixDialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from './dialog';

export interface DialogPresentationProps {
  /**
   * Current open state of the dialog
   */
  isOpen: boolean;
  
  /**
   * Function to handle open state changes
   */
  handleOpenChange: (open: boolean) => void;
  
  /**
   * Dialog trigger element
   */
  trigger?: React.ReactNode;
  
  /**
   * Whether the trigger should be rendered as a child
   */
  asChild?: boolean;
  
  /**
   * Dialog content
   */
  children: React.ReactNode;
  
  /**
   * Dialog title
   */
  title?: React.ReactNode;
  
  /**
   * Dialog description
   */
  description?: React.ReactNode;
  
  /**
   * Dialog footer content
   */
  footer?: React.ReactNode;
  
  /**
   * Additional class name for the content
   */
  contentClassName?: string;
  
  /**
   * Additional class name for the header
   */
  headerClassName?: string;
  
  /**
   * Additional class name for the footer
   */
  footerClassName?: string;
  
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean;
}

/**
 * Presentation component for Dialog
 */
export function DialogPresentation({
  isOpen,
  handleOpenChange,
  trigger,
  asChild = false,
  children,
  title,
  description,
  footer,
  contentClassName,
  headerClassName,
  footerClassName,
  showCloseButton = true
}: DialogPresentationProps) {
  return (
    <RadixDialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild={asChild} data-testid="dialog-trigger">
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className={contentClassName} data-testid="dialog-content">
        {(title || description) && (
          <DialogHeader className={headerClassName} data-testid="dialog-header">
            {title && <DialogTitle data-testid="dialog-title">{title}</DialogTitle>}
            {description && <DialogDescription data-testid="dialog-description">{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        <div data-testid="dialog-body">
          {children}
        </div>
        
        {footer && (
          <DialogFooter className={footerClassName} data-testid="dialog-footer">
            {footer}
          </DialogFooter>
        )}
        
        {!showCloseButton && (
          <DialogClose className="hidden" />
        )}
      </DialogContent>
    </RadixDialog>
  );
}

export default DialogPresentation;
