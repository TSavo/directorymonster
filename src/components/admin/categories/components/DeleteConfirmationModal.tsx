'use client';

import { useEffect, useRef } from 'react';
import { DeleteConfirmationModalProps } from '../types';

export default function DeleteConfirmationModal({
  isOpen,
  title,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
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
  
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button when modal opens for better keyboard navigation
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }
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
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            data-testid="cancel-button"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            data-testid="confirm-delete-button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
