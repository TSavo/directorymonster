/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationModal } from '../../../../src/components/admin/categories/components';

describe('DeleteConfirmationModal Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any lingering focus from previous tests
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    it('sets focus on cancel button when opened', async () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Wait for the focus to be set after the setTimeout in the component
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
    });
  });
  
  it('maintains focus trap within modal when tabbing', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Wait for initial focus to be set
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
    });
    
    // Tab to Delete button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('confirm-delete-button'));
    
    // Tab again should cycle back to cancel button (since there are only two focusable elements)
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
  });
  
  it('can trigger Cancel button with keyboard', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Get the cancel button and press it with keyboard
    const cancelButton = screen.getByTestId('cancel-button');
    await waitFor(() => {
      expect(document.activeElement).toBe(cancelButton);
    });
    
    await user.keyboard('{Enter}');
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    
    // Reset for space key test
    mockOnCancel.mockClear();
    
    // Test Space key works too
    await user.keyboard(' ');
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('can trigger Confirm button with keyboard', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Tab to the confirm button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('confirm-delete-button'));
    
    // Press Enter key
    await user.keyboard('{Enter}');
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    
    // Reset for space key test
    mockOnConfirm.mockClear();
    
    // Test Space key works too
    await user.keyboard(' ');
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
  
  it('handles different keyboard events correctly', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Test various keyboard events
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'Home' });
    fireEvent.keyDown(document, { key: 'End' });
    
    // None of these should trigger onCancel
    expect(mockOnCancel).not.toHaveBeenCalled();
    
    // Only Escape should trigger onCancel
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('properly manages focus when closed and reopened', async () => {
    const { rerender } = render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Initial focus should be on cancel button
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
    });
    
    // Close the modal
    rerender(
      <DeleteConfirmationModal
        isOpen={false}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Reopen the modal
    rerender(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Focus should be set again on the cancel button
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
    });
  });
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
    
    // Verify accessibility of action buttons
    const cancelButton = screen.getByTestId('cancel-button');
    const deleteButton = screen.getByTestId('confirm-delete-button');
    
    // Check that buttons have accessible focus indicators
    expect(cancelButton).toHaveClass('focus:ring-2');
    expect(deleteButton).toHaveClass('focus:ring-2');
  });
});
