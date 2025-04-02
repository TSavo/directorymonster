import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationModal } from '@/components/admin/sites/table/DeleteConfirmationModal';

describe('DeleteConfirmationModal Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  it('calls onConfirm when confirm button is clicked', async () => {
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

    // Click the confirm button
    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);

    // Verify callback was called
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);

    // Cancel callback should not be called
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
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

    // Click the cancel button
    const cancelButton = screen.getByTestId('cancel-delete-button');
    await user.click(cancelButton);

    // Verify callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);

    // Confirm callback should not be called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
