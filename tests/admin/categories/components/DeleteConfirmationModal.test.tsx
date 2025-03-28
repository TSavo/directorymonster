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
    
    // Test using data-testid attributes
    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Delete Category');
    expect(screen.getByTestId('modal-description')).toHaveTextContent(/Are you sure you want to delete/);
    expect(screen.getByTestId('item-name')).toHaveTextContent('"Test Category"');
    expect(screen.getByTestId('cancel-button')).toHaveTextContent('Cancel');
    expect(screen.getByTestId('confirm-delete-button')).toHaveTextContent('Delete');
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
    
    fireEvent.click(screen.getByTestId('confirm-delete-button'));
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
    
    fireEvent.click(screen.getByTestId('cancel-button'));
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
    
    // Find the dialog background using data-testid
    const backdrop = screen.getByTestId('delete-confirmation-modal');
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
  
  it('does not call onCancel when other keys are pressed', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
  
  it('properly prevents modal background click propagation', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Click on the modal content itself, which should not call onCancel
    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);
    
    expect(mockOnCancel).not.toHaveBeenCalled();
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
    
    const dialog = screen.getByTestId('delete-confirmation-modal');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('role', 'dialog');
    
    const title = screen.getByTestId('modal-title');
    expect(title).toHaveAttribute('id', 'modal-title');
  });
});
