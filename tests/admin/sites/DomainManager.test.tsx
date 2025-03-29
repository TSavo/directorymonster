import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainManager } from '@/components/admin/sites/DomainManager';

describe('DomainManager', () => {
  it('renders correctly', () => {
    render(<DomainManager />);
    
    // Basic rendering tests
    expect(screen.getByTestId('domainManager-header')).toBeInTheDocument();
  });

  it('renders with initial props', () => {
    const initialData = {
      name: 'Test Name',
      slug: 'test-slug',
      description: 'Test description',
      domains: ['test.com']
    };
    
    render(<DomainManager initialData={initialData} />);
    
    // Component-specific assertions
    expect(screen.getByDisplayValue('Test Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-slug')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
  });

  it('calls callbacks correctly', async () => {
    const user = userEvent.setup();
    const mockOnCancel = jest.fn();
    
    render(<DomainManager onCancel={mockOnCancel} />);
    
    // Find and click the cancel button
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    // Verify callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
