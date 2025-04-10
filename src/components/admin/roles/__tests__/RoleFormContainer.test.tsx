import React from 'react';
import { render } from '@testing-library/react';
import { RoleFormContainer } from '../RoleFormContainer';
import { useRoleForm } from '../hooks/useRoleForm';
import { RoleFormPresentation } from '../RoleFormPresentation';
import { RoleScope, RoleType } from '@/types/role';

// Mock the hook
jest.mock('../hooks/useRoleForm');

// Mock the presentation component
jest.mock('../RoleFormPresentation', () => ({
  RoleFormPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('RoleFormContainer', () => {
  const mockRole = {
    id: '1',
    name: 'Test Role',
    description: 'Test Description',
    scope: RoleScope.TENANT,
    type: RoleType.CUSTOM,
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockSiteOptions = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' }
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const mockHookReturn = {
    form: {} as any,
    isEditMode: false,
    selectedScope: RoleScope.TENANT,
    handleSubmit: jest.fn(),
    handleScopeChange: jest.fn(),
    formSchema: {} as any
  };

  const defaultProps = {
    tenantId: 'tenant-1',
    siteOptions: mockSiteOptions,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRoleForm as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('passes props to the hook', () => {
    render(<RoleFormContainer {...defaultProps} />);
    expect(useRoleForm).toHaveBeenCalledWith(defaultProps);
  });

  it('passes hook results and additional props to the presentation component', () => {
    render(<RoleFormContainer {...defaultProps} />);
    expect(RoleFormPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockHookReturn,
        siteOptions: mockSiteOptions,
        onCancel: mockOnCancel
      }),
      expect.anything()
    );
  });

  it('passes role to the hook when provided', () => {
    render(<RoleFormContainer {...defaultProps} role={mockRole} />);
    expect(useRoleForm).toHaveBeenCalledWith(
      expect.objectContaining({
        role: mockRole
      })
    );
  });
});
