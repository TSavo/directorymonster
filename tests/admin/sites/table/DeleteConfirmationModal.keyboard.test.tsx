import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationModal } from '@/components/admin/sites/table/DeleteConfirmationModal';

describe('DeleteConfirmationModal Component - Keyboard Accessibility', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  it('supports keyboard navigation between buttons', async () => {
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

    // First focusable element should be the confirm button
    await user.tab();
    expect(screen.getByTestId('confirm-delete-button')).toHaveFocus();

    // Tab again to focus on cancel button
    await user.tab();
    expect(screen.getByTestId('cancel-delete-button')).toHaveFocus();
  });

  it('responds to Enter key on focused buttons', async () => {
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

    // Tab to the confirm button
    await user.tab();
    expect(screen.getByTestId('confirm-delete-button')).toHaveFocus();

    // Press Enter to trigger the button
    await user.keyboard('{Enter}');
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', async () => {
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

    // Press Escape key
    await user.keyboard('{Escape}');

    // Cancel should be called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
