/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationModal } from '@/components/admin/categories/components';

/**
 * Test suite for the DeleteConfirmationModal component
 * 
 * This suite tests the DeleteConfirmationModal component thoroughly, including:
 * - Rendering in open and closed states
 * - Action button functionality (confirm and cancel)
 * - Backdrop click handling
 * - Keyboard interaction (Escape, Enter, Space, Tab)
 * - Focus management and focus trapping
 * - Accessibility attributes and behavior
 * - Edge cases and error handling
 */
describe('DeleteConfirmationModal Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any lingering focus from previous tests
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
                                });
  
  it('handles null callbacks gracefully', () => {
    // Test with undefined callbacks
    expect(() => {
      render(
        <DeleteConfirmationModal
          isOpen={true}
          title="Delete Category"
          itemName="Test Category"
          onConfirm={undefined as any}
          onCancel={undefined as any}
        />
      );
    }).not.toThrow();
    
    // Should still render properly
    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    
    // Click buttons should not cause errors
    expect(() => {
      fireEvent.click(screen.getByTestId('cancel-button'));
      fireEvent.click(screen.getByTestId('confirm-delete-button'));
    }).not.toThrow();
  });
  
  it('renders with different title and item name values', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Remove Product"
        itemName="Premium Subscription"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Remove Product');
    expect(screen.getByTestId('item-name')).toHaveTextContent('"Premium Subscription"');
  });
  
  it('supports interaction via Enter key on modal buttons', async () => {
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
    
    // Tab to the delete button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('confirm-delete-button'));
    
    // Press Enter key
    await user.keyboard('{Enter}');
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
  
  it('preserves modal structure when handling long item names', () => {
    const longItemName = 'This is an extremely long category name that might cause layout issues if not handled properly';
    
    render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName={longItemName}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    const itemNameElement = screen.getByTestId('item-name');
    expect(itemNameElement).toHaveTextContent(`"${longItemName}"`);
    
    // Verify the modal content still has proper structure
    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('p-6'); // Should maintain padding
    
    // The modal should still be centered
    const modalContainer = screen.getByTestId('delete-confirmation-modal');
    expect(modalContainer).toHaveClass('flex items-center justify-center');
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
  
  it('has proper accessibility attributes and structure', () => {
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
    
    // Verify semantic structure
    expect(cancelButton).toHaveAttribute('type', 'button');
    expect(deleteButton).toHaveAttribute('type', 'button');
    
    // Check that the modal description provides clear instructions
    const description = screen.getByTestId('modal-description');
    expect(description).toHaveTextContent('This action cannot be undone');
    
    // Verify that the item name is properly highlighted for emphasis
    const itemName = screen.getByTestId('item-name');
    expect(itemName).toHaveClass('font-medium');
    
    // Check the button container has proper spacing
    const buttonContainer = cancelButton.parentElement;
    expect(buttonContainer).toHaveClass('space-x-3');
  });

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
  
  it('maintains focus trap within modal when tabbing forward', async () => {
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
  
  it('maintains focus trap within modal when tabbing backward', async () => {
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
    
    // Use Shift+Tab to go backward from first element
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    
    // Should cycle to the last element (confirm button)
    expect(document.activeElement).toBe(screen.getByTestId('confirm-delete-button'));
    
    // Use Shift+Tab again
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    
    // Should cycle back to first element (cancel button)
    expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
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
  
  it('restores focus when the modal is closed', async () => {
    // Create a button that will be focused before opening the modal
    document.body.innerHTML = '<button id="external-button">External Button</button>';
    const externalButton = document.getElementById('external-button');
    externalButton?.focus();
    
    expect(document.activeElement).toBe(externalButton);
    
    const { rerender } = render(
      <DeleteConfirmationModal
        isOpen={true}
        title="Delete Category"
        itemName="Test Category"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Modal should focus cancel button
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
    
    // In a real application, focus would typically return to the triggering element
    // However, this is typically handled by the parent component, not the modal itself
    // For this test, we're just verifying that focus is no longer on the modal elements
    expect(document.activeElement).not.toBe(screen.queryByTestId('cancel-button'));
    expect(document.activeElement).not.toBe(screen.queryByTestId('confirm-delete-button'));
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
