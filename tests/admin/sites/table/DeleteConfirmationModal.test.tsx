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
        siteId="site-123"
        siteName="Test Site"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Check if modal content is rendered
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    expect(screen.getByTestId('delete-modal-title')).toBeInTheDocument();
    expect(screen.getByTestId('delete-modal-content')).toBeInTheDocument();
    
    // Check if the site name is displayed
    expect(screen.getByTestId('delete-modal-content')).toHaveTextContent('Test Site');
    
    // Check if action buttons are rendered
    expect(screen.getByTestId('delete-modal-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('delete-modal-confirm')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <DeleteConfirmationModal 
        isOpen={false}
        siteId="site-123"
        siteName="Test Site"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Modal should not be rendered
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
  });

  it('has appropriate warning styling', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <DeleteConfirmationModal 
        isOpen={true}
        siteId="site-123"
        siteName="Test Site"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Delete button should have warning/danger styling
    const deleteButton = screen.getByTestId('delete-modal-confirm');
    expect(deleteButton).toHaveClass('danger', { exact: false }); // The actual class name may vary
    
    // Delete button should have descriptive text
    expect(deleteButton).toHaveTextContent(/delete|remove/i);
  });
});
