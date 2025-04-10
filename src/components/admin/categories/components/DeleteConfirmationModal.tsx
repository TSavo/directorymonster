'use client';

import { useEffect, useRef } from 'react';
import { DeleteConfirmationModalProps } from '../types';
import { Button } from '@/components/ui/Button';

/**
 * DeleteConfirmationModal Component
 *
 * A fully accessible modal dialog for confirming delete actions.
 * Includes focus management, keyboard navigation support, and proper ARIA attributes.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the modal is visible
 * @param props.title - Title text for the modal
 * @param props.itemName - Name of the item being deleted
 * @param props.onConfirm - Function to call when deletion is confirmed
 * @param props.onCancel - Function to call when deletion is cancelled
 */
export function DeleteConfirmationModal({
  isOpen,
  title,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
  // Handle Escape key press
  // Reference to store the element that had focus before opening modal
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      // Attempt to restore focus when modal closes
      // This is a fallback; the parent component would typically handle this
      setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onCancel) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onCancel]);

  // Handle focus management
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button when modal opens for better keyboard navigation
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }

    return () => {
      // When modal unmounts, we could restore focus in this cleanup function
      // However, this would interfere with the isOpen effect above that handles focus
      // So we leave focus restoration to that effect
    }
  }, [isOpen]);

  // Handle focus trapping
  useEffect(() => {
    const handleTabKey = (event: KeyboardEvent) => {
      if (!isOpen || event.key !== 'Tab') return;

      // Find all focusable elements in the modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // If shift+tab and on first element, move to last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If tab and on last element, move to first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="delete-confirmation-modal"
      ref={modalRef}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-content"
      >
        <h2 id="modal-title" className="text-xl font-semibold text-gray-900 mb-4" data-testid="modal-title">{title}</h2>

        <p className="text-gray-700 mb-6" data-testid="modal-description">
          Are you sure you want to delete <span className="font-medium" data-testid="item-name">"{itemName}"</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <Button
            ref={cancelButtonRef}
            type="button"
            onClick={() => onCancel && onCancel()}
            variant="secondary"
            data-testid="cancel-button"
          >
            Cancel
          </Button>

          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={() => onConfirm && onConfirm()}
            variant="danger"
            data-testid="confirm-delete-button"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// Also export as default for backward compatibility
export default DeleteConfirmationModal;
