/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeleteConfirmationModal } from '../../../../src/components/admin/categories/components';

describe('DeleteConfirmationModal Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly when open', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Delete Category')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('"Test Category"')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <DeleteConfirmationModal
        isOpen={false}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
  });
  
  it('calls onConfirm when Delete button is clicked', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
  
  it('calls onCancel when Cancel button is clicked', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('calls onCancel when backdrop is clicked', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Find the dialog background (the first element with role="dialog")
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('calls onCancel when Escape key is pressed', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('has proper accessibility attributes', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    
    const title = screen.getByText('Delete Category');
    expect(title).toHaveAttribute('id', 'modal-title');
  });
});
