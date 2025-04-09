'use client';

import { useState, useCallback, useEffect } from 'react';

export interface UseDialogProps {
  /**
   * Whether the dialog is open by default
   */
  defaultOpen?: boolean;
  
  /**
   * Controlled open state
   */
  open?: boolean;
  
  /**
   * Callback when the open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

export interface UseDialogReturn {
  /**
   * Current open state of the dialog
   */
  isOpen: boolean;
  
  /**
   * Function to open the dialog
   */
  openDialog: () => void;
  
  /**
   * Function to close the dialog
   */
  closeDialog: () => void;
  
  /**
   * Function to toggle the dialog open state
   */
  toggleDialog: () => void;
  
  /**
   * Function to handle open state changes
   */
  handleOpenChange: (open: boolean) => void;
}

/**
 * Hook for managing dialog state
 */
export function useDialog({
  defaultOpen = false,
  open,
  onOpenChange
}: UseDialogProps = {}): UseDialogReturn {
  // Use controlled state if provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  // Update internal state when controlled prop changes
  useEffect(() => {
    if (isControlled) {
      setInternalOpen(open);
    }
  }, [isControlled, open]);
  
  // Handle state changes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    // Always update internal state
    setInternalOpen(newOpen);
    
    // Call onOpenChange if provided
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  }, [onOpenChange]);
  
  // Convenience methods
  const openDialog = useCallback(() => handleOpenChange(true), [handleOpenChange]);
  const closeDialog = useCallback(() => handleOpenChange(false), [handleOpenChange]);
  const toggleDialog = useCallback(() => handleOpenChange(!isOpen), [handleOpenChange, isOpen]);
  
  return {
    isOpen,
    openDialog,
    closeDialog,
    toggleDialog,
    handleOpenChange
  };
}

export default useDialog;
