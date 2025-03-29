import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEOSettings } from '@/components/admin/sites/SEOSettings';
import '@testing-library/jest-dom';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('SEOSettings Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('validates SEO title length (max 60 chars)', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add a title that's too long (61 characters)
    await user.type(screen.getByTestId('seoSettings-seoTitle'), 'A'.repeat(61));
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Check validation error
    expect(screen.getByText('SEO title should be 60 characters or less')).toBeInTheDocument();
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates SEO description length (max 160 chars)', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add a description that's too long (161 characters)
    await user.type(screen.getByTestId('seoSettings-seoDescription'), 'A'.repeat(161));
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Check validation error
    expect(screen.getByText('SEO description should be 160 characters or less')).toBeInTheDocument();
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates Twitter site handle format (must start with @)', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add a Twitter handle without @
    await user.type(screen.getByTestId('seoSettings-twitterSite'), 'invalidhandle');
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Check validation error
    expect(screen.getByText('Twitter handle should start with @')).toBeInTheDocument();
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates structured data JSON format', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add invalid JSON
    await user.type(screen.getByTestId('seoSettings-structuredData'), '{invalid json}');
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Check validation error
    expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clears validation errors when fields are corrected', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add invalid values
    await user.type(screen.getByTestId('seoSettings-seoTitle'), 'A'.repeat(61));
    
    // Submit form to trigger validation
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Check validation error appears
    expect(screen.getByText('SEO title should be 60 characters or less')).toBeInTheDocument();
    
    // Fix the title
    await user.clear(screen.getByTestId('seoSettings-seoTitle'));
    await user.type(screen.getByTestId('seoSettings-seoTitle'), 'Fixed Title');
    
    // Check error is gone
    expect(screen.queryByText('SEO title should be 60 characters or less')).not.toBeInTheDocument();
  });
});
