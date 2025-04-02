import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormActions } from '@/components/admin/sites/components/FormActions';

describe('FormActions Component - Basic Rendering', () => {
  it('renders next and back buttons correctly', () => {
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

    // Check if both buttons are rendered
    expect(screen.getByTestId('form-back-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();

    // Next button should say "Next" not "Submit"
    expect(screen.getByTestId('next-button')).toHaveTextContent('Next');
  });

  it('renders submit button on last step', () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    render(
      <FormActions
        isFirstStep={false}
        isLastStep={true}
        isLoading={false}
        onNext={mockHandleNext}
        onPrevious={mockHandleBack}
        onCancel={() => {}}
      />
    );

    // Check if both buttons are rendered
    expect(screen.getByTestId('form-back-button')).toBeInTheDocument();
    expect(screen.getByTestId('form-next-button')).toBeInTheDocument();

    // Next button should say "Create Site" on last step
    expect(screen.getByTestId('form-next-button')).toHaveTextContent('Create Site');
  });

  it('hides back button on first step', () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    render(
      <FormActions
        isFirstStep={true}
        isLastStep={false}
        isLoading={false}
        onNext={mockHandleNext}
        onPrevious={mockHandleBack}
        onCancel={() => {}}
      />
    );

    // Back button should not be visible
    expect(screen.queryByTestId('form-back-button')).not.toBeInTheDocument();

    // Next button should be visible
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
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

    // Next button should be disabled when submitting
    const submitButton = screen.getByTestId('form-next-button');
    expect(submitButton).toBeDisabled();

    // Should show loading indicator/text
    expect(submitButton).toHaveTextContent(/loading/i);
    expect(screen.getByTestId('submit-loading')).toBeInTheDocument();
  });
});
