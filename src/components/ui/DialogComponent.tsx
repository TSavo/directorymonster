'use client';

import React from 'react';
import { DialogContainer, DialogContainerProps } from './DialogContainer';

/**
 * Dialog Component
 * 
 * A modal dialog component that follows the container/presentation pattern.
 * This component is a thin wrapper around DialogContainer for backward compatibility.
 * 
 * @example
 * ```tsx
 * <Dialog
 *   trigger={<Button>Open Dialog</Button>}
 *   title="Dialog Title"
 *   description="This is a description of the dialog."
 *   footer={<Button>Close</Button>}
 * >
 *   <p>Dialog content goes here.</p>
 * </Dialog>
 * ```
 */
export function Dialog(props: DialogContainerProps) {
  return <DialogContainer {...props} />;
}

// Re-export the Dialog components from the primitive components
export {
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

export default Dialog;
