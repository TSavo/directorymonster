import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSettings } from '@/components/admin/sites/SiteSettings';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('SiteSettings Component - Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });

  it('performs form validation', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Set invalid values
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '0');
    
    // Use fireEvent for CSS with braces
    const customStylesInput = screen.getByTestId('siteSettings-customStyles');
    fireEvent.change(customStylesInput, { 
      target: { 
        value: '{ unclosed brace', 
        name: 'customStyles'
      } 
    });
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Verify fetch was not called due to validation errors
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates CSS properly', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Test valid CSS
    const customStylesInput = screen.getByTestId('siteSettings-customStyles');
    fireEvent.change(customStylesInput, { 
      target: { 
        value: '.header { color: blue; } .footer { background: gray; }',
        name: 'customStyles'
      } 
    });
    
    // Submit should proceed without CSS errors
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Now test invalid CSS
    fireEvent.change(customStylesInput, { 
      target: { 
        value: '.header { color: blue; .footer { background: gray; }',
        name: 'customStyles'
      } 
    });
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Fetch should not be called with invalid CSS
    expect(global.fetch).toHaveBeenCalledTimes(1); // First call with valid CSS
  });

  it('clears validation state when values change', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Set invalid values
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '0');
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Expect fetch not to be called due to validation error
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Fix the invalid value
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '20');
    
    // Submit again
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Fetch should now be called since errors are cleared
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Set invalid email
    await user.clear(screen.getByTestId('siteSettings-contactEmail'));
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'invalid-email');
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Verify fetch was not called due to validation errors
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Fix with valid email
    await user.clear(screen.getByTestId('siteSettings-contactEmail'));
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'valid@example.com');
    
    // Submit again
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Fetch should now be called
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
