/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleWizardNavigation } from '../RoleWizardNavigation';

describe('RoleWizardNavigation', () => {
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnFinish = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders back and next buttons on first step', () => {
    render(
      <RoleWizardNavigation
        currentStep={1}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
      />
    );
    
    // Back button should be disabled on first step
    const backButton = screen.getByText('Back').closest('button');
    expect(backButton).toBeDisabled();
    
    // Next button should be enabled
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).not.toBeDisabled();
    
    // Finish button should not be rendered
    expect(screen.queryByText('Finish')).not.toBeInTheDocument();
  });

  it('renders enabled back and next buttons on middle steps', () => {
    render(
      <RoleWizardNavigation
        currentStep={2}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
      />
    );
    
    // Back button should be enabled
    const backButton = screen.getByText('Back').closest('button');
    expect(backButton).not.toBeDisabled();
    
    // Next button should be enabled
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).not.toBeDisabled();
  });

  it('renders back and finish buttons on last step', () => {
    render(
      <RoleWizardNavigation
        currentStep={4}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
      />
    );
    
    // Back button should be enabled
    const backButton = screen.getByText('Back').closest('button');
    expect(backButton).not.toBeDisabled();
    
    // Next button should not be rendered
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    
    // Finish button should be rendered and enabled
    const finishButton = screen.getByText('Finish').closest('button');
    expect(finishButton).not.toBeDisabled();
  });

  it('disables next button when isNextDisabled is true', () => {
    render(
      <RoleWizardNavigation
        currentStep={1}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={true}
      />
    );
    
    // Next button should be disabled
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('disables finish button when isNextDisabled is true', () => {
    render(
      <RoleWizardNavigation
        currentStep={4}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={true}
      />
    );
    
    // Finish button should be disabled
    const finishButton = screen.getByText('Finish').closest('button');
    expect(finishButton).toBeDisabled();
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <RoleWizardNavigation
        currentStep={2}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
      />
    );
    
    // Click the back button
    const backButton = screen.getByText('Back').closest('button');
    fireEvent.click(backButton!);
    
    // onBack should have been called
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button is clicked', () => {
    render(
      <RoleWizardNavigation
        currentStep={1}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
      />
    );
    
    // Click the next button
    const nextButton = screen.getByText('Next').closest('button');
    fireEvent.click(nextButton!);
    
    // onNext should have been called
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('calls onFinish when finish button is clicked', () => {
    render(
      <RoleWizardNavigation
        currentStep={4}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
      />
    );
    
    // Click the finish button
    const finishButton = screen.getByText('Finish').closest('button');
    fireEvent.click(finishButton!);
    
    // onFinish should have been called
    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isSubmitting is true', () => {
    render(
      <RoleWizardNavigation
        currentStep={4}
        totalSteps={4}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onFinish={mockOnFinish}
        isNextDisabled={false}
        isSubmitting={true}
      />
    );
    
    // Back button should be disabled during submission
    const backButton = screen.getByText('Back').closest('button');
    expect(backButton).toBeDisabled();
    
    // Should show "Creating..." text
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    
    // Should not show "Finish" text
    expect(screen.queryByText('Finish')).not.toBeInTheDocument();
  });
});
