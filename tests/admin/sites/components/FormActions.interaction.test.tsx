import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormActions } from '@/components/admin/sites/components/FormActions';

describe('FormActions Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  it('calls handleNext when next button is clicked', async () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    render(
      <FormActions
        isFirstStep={false}
        isLastStep={false}
        isLoading={false}
        onNext={mockHandleNext}
        onPrevious={mockHandleBack}
        onCancel={() => {}}
      />
    );

    // Click the next button
    const nextButton = screen.getByTestId('form-next-button');
    await user.click(nextButton);

    // Verify callback was called
    expect(mockHandleNext).toHaveBeenCalledTimes(1);
  });

  it('calls handleBack when back button is clicked', async () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    render(
      <FormActions
        isFirstStep={false}
        isLastStep={false}
        isLoading={false}
        onNext={mockHandleNext}
        onPrevious={mockHandleBack}
        onCancel={() => {}}
      />
    );

    // Click the back button
    const backButton = screen.getByTestId('form-back-button');
    await user.click(backButton);

    // Verify callback was called
    expect(mockHandleBack).toHaveBeenCalledTimes(1);
  });

  it('prevents clicking next button when submitting', async () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    render(
      <FormActions
        isFirstStep={false}
        isLastStep={true}
        isLoading={true}
        onNext={mockHandleNext}
        onPrevious={mockHandleBack}
        onCancel={() => {}}
      />
    );

    // Try to click the submit button
    const submitButton = screen.getByTestId('form-next-button');
    await user.click(submitButton);

    // Verify callback was not called because button is disabled
    expect(mockHandleNext).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation properly', async () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    render(
      <FormActions
        isFirstStep={false}
        isLastStep={false}
        isLoading={false}
        onNext={mockHandleNext}
        onPrevious={mockHandleBack}
        onCancel={() => {}}
      />
    );

    // Tab to the back button
    await user.tab();
    expect(screen.getByTestId('form-back-button')).toHaveFocus();

    // Press Enter to click
    await user.keyboard('{Enter}');
    expect(mockHandleBack).toHaveBeenCalledTimes(1);

    // Reset mock
    mockHandleBack.mockReset();

    // Tab to the cancel button
    await user.tab();
    expect(screen.getByTestId('cancel-button')).toHaveFocus();

    // Tab to the next button
    await user.tab();
    expect(screen.getByTestId('form-next-button')).toHaveFocus();

    // Press Space to click
    await user.keyboard(' ');
    expect(mockHandleNext).toHaveBeenCalledTimes(1);
  });
});
