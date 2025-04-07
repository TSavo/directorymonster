/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleWizardContainer } from '../RoleWizardContainer';
import { RoleWizardSteps } from '../RoleWizardSteps';
import { RoleBasicInfoStep } from '../steps/RoleBasicInfoStep';
import { RolePermissionsStep } from '../steps/RolePermissionsStep';
import { RoleInheritanceStep } from '../steps/RoleInheritanceStep';
import { RoleSummaryStep } from '../steps/RoleSummaryStep';
import { RoleWizardNavigation } from '../RoleWizardNavigation';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the child components
jest.mock('../RoleWizardSteps', () => ({
  RoleWizardSteps: jest.fn(() => <div data-testid="role-wizard-steps" />),
}));

jest.mock('../steps/RoleBasicInfoStep', () => ({
  RoleBasicInfoStep: jest.fn(() => <div data-testid="role-basic-info-step" />),
}));

jest.mock('../steps/RolePermissionsStep', () => ({
  RolePermissionsStep: jest.fn(() => <div data-testid="role-permissions-step" />),
}));

jest.mock('../steps/RoleInheritanceStep', () => ({
  RoleInheritanceStep: jest.fn(() => <div data-testid="role-inheritance-step" />),
}));

jest.mock('../steps/RoleSummaryStep', () => ({
  RoleSummaryStep: jest.fn(() => <div data-testid="role-summary-step" />),
}));

jest.mock('../RoleWizardNavigation', () => ({
  RoleWizardNavigation: jest.fn(() => <div data-testid="role-wizard-navigation" />),
}));

// Mock fetch
global.fetch = jest.fn();

describe('RoleWizardContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: { id: 'role-123' } }),
    });
  });

  it('renders the first step by default', () => {
    render(<RoleWizardContainer />);
    
    expect(screen.getByTestId('role-wizard-steps')).toBeInTheDocument();
    expect(screen.getByTestId('role-basic-info-step')).toBeInTheDocument();
    expect(screen.getByTestId('role-wizard-navigation')).toBeInTheDocument();
    
    expect(RoleWizardSteps).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 1,
        totalSteps: 4,
      }),
      expect.anything()
    );
  });

  it('passes the correct props to the BasicInfoStep', () => {
    render(<RoleWizardContainer />);
    
    expect(RoleBasicInfoStep).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '',
          description: '',
          scope: 'tenant',
        }),
        onUpdate: expect.any(Function),
      }),
      expect.anything()
    );
  });

  it('updates wizard data when step data changes', () => {
    render(<RoleWizardContainer />);
    
    // Get the onUpdate function passed to RoleBasicInfoStep
    const { onUpdate } = (RoleBasicInfoStep as jest.Mock).mock.calls[0][0];
    
    // Call onUpdate with new data
    onUpdate({ name: 'Test Role', description: 'Test Description' });
    
    // Re-render should have updated props
    expect(RoleBasicInfoStep).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Test Role',
          description: 'Test Description',
        }),
      }),
      expect.anything()
    );
  });

  it('moves to the next step when handleNext is called', () => {
    render(<RoleWizardContainer />);
    
    // Get the onNext function passed to RoleWizardNavigation
    const { onNext } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    
    // Call onNext to move to the next step
    onNext();
    
    // Should now render the permissions step
    expect(RolePermissionsStep).toHaveBeenCalled();
    
    // RoleWizardSteps should have been updated
    expect(RoleWizardSteps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentStep: 2,
      }),
      expect.anything()
    );
  });

  it('moves to the previous step when handleBack is called', () => {
    render(<RoleWizardContainer />);
    
    // Get the navigation functions
    const { onNext } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    
    // Move to step 2
    onNext();
    
    // Clear mocks to check new calls
    jest.clearAllMocks();
    
    // Get the updated navigation functions
    const { onBack } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    
    // Move back to step 1
    onBack();
    
    // Should now render the basic info step again
    expect(RoleBasicInfoStep).toHaveBeenCalled();
    
    // RoleWizardSteps should have been updated
    expect(RoleWizardSteps).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 1,
      }),
      expect.anything()
    );
  });

  it('submits the form when handleFinish is called on the last step', async () => {
    const { useRouter } = require('next/navigation');
    const mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<RoleWizardContainer />);
    
    // Get the navigation functions
    const { onNext } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    
    // Move to step 2
    onNext();
    
    // Move to step 3
    onNext();
    
    // Move to step 4
    onNext();
    
    // Get the updated navigation functions
    const { onFinish } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    
    // Finish the wizard
    await onFinish();
    
    // Should have called fetch to create the role
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/roles', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    }));
    
    // Should navigate to the new role's permissions page
    expect(mockPush).toHaveBeenCalledWith('/admin/roles/role-123/permissions');
  });

  it('handles API errors when creating a role', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to create role' }),
    });
    
    const { useToast } = require('@/components/ui/use-toast');
    const mockToast = jest.fn();
    useToast.mockImplementation(() => ({
      toast: mockToast,
    }));
    
    render(<RoleWizardContainer />);
    
    // Navigate to the last step
    const { onNext } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    onNext();
    onNext();
    onNext();
    
    // Get the updated navigation functions
    const { onFinish } = (RoleWizardNavigation as jest.Mock).mock.calls[0][0];
    
    // Finish the wizard
    await onFinish();
    
    // Should show an error toast
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to create role',
        variant: 'destructive',
      })
    );
  });
});
