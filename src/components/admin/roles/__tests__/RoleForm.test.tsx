/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { RoleForm } from '../RoleForm';
import { RoleFormContainer } from '../RoleFormContainer';
import { RoleScope, RoleType } from '@/types/role';

// Mock the container component
jest.mock('../RoleFormContainer', () => ({
  RoleFormContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('RoleForm', () => {
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

  const defaultProps = {
    tenantId: 'tenant-1',
    siteOptions: mockSiteOptions,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<RoleForm {...defaultProps} />);
    expect(RoleFormContainer).toHaveBeenCalled();
  });

  it('passes all props to the container component', () => {
    render(<RoleForm {...defaultProps} />);
    expect(RoleFormContainer).toHaveBeenCalledWith(
      expect.objectContaining(defaultProps),
      expect.anything()
    );
  });

  it('passes role to the container component when provided', () => {
    render(<RoleForm {...defaultProps} role={mockRole} />);
    expect(RoleFormContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        role: mockRole
      }),
      expect.anything()
    );
  });
});
