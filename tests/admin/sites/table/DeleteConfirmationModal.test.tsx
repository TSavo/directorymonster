import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeleteConfirmationModal } from '@/components/admin/sites/table/DeleteConfirmationModal';

describe('DeleteConfirmationModal Component - Basic Rendering', () => {
  it('renders the modal when isOpen is true', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <DeleteConfirmationModal
        isOpen={true}
        siteName="Test Site"
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Check if modal content is rendered
    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();

    // Check if the site name is displayed
    expect(screen.getByText(/Test Site/)).toBeInTheDocument();

    // Check if action buttons are rendered
    expect(screen.getByTestId('cancel-delete-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <DeleteConfirmationModal
        isOpen={false}
        siteName="Test Site"
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Modal should not be rendered
    expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
  });

  it('has appropriate warning styling', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <DeleteConfirmationModal
        isOpen={true}
        siteName="Test Site"
        isLoading={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Delete button should have warning/danger styling
    const deleteButton = screen.getByTestId('confirm-delete-button');
    expect(deleteButton).toHaveClass('bg-red-600', { exact: false }); // Check for red background class

    // Delete button should have descriptive text
    expect(deleteButton).toHaveTextContent(/delete/i);
  });
});
