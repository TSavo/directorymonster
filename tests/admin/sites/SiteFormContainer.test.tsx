import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormContainer } from '@/components/admin/sites/SiteFormContainer';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SiteFormContainer', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders the form with the correct title', () => {
    render(<SiteFormContainer />);
    
    // Check for the form title
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');
  });
  
  it('renders the form with edit title when in edit mode', () => {
    render(<SiteFormContainer mode="edit" initialData={{ id: '123', name: 'Test Site' }} />);
    
    // Check for the form title
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Edit Site');
  });
  
  it('renders the step navigation', () => {
    render(<SiteFormContainer />);
    
    // Check for step navigation
    expect(screen.getByTestId('step-navigation')).toBeInTheDocument();
  });
  
  it('renders the first step by default', () => {
    render(<SiteFormContainer />);
    
    // Check that the first step (basic info) is rendered
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
  });
  
  it('renders the specified initial step', () => {
    render(<SiteFormContainer initialStep="domains" />);
    
    // Check that the domains step is rendered
    expect(screen.getByTestId('domains-step')).toBeInTheDocument();
  });
  
  it('navigates to the next step when next button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SiteFormContainer />);
    
    // Fill in required fields in the first step
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    
    // Click the next button
    await user.click(screen.getByTestId('form-next-button'));
    
    // Check that we've moved to the domains step
    await waitFor(() => {
      expect(screen.getByTestId('domains-step')).toBeInTheDocument();
    });
  });
});
