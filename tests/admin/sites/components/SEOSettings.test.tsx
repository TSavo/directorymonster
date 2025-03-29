import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('SEOSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders correctly with default values', () => {
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Check component renders with correct structure
    expect(screen.getByTestId('seoSettings-header')).toBeInTheDocument();
    expect(screen.getByText('SEO Settings')).toBeInTheDocument();
    
    // Check form sections exist
    expect(screen.getByText('Meta Tags')).toBeInTheDocument();
    expect(screen.getByText('Social Media')).toBeInTheDocument();
    expect(screen.getByText('Technical SEO')).toBeInTheDocument();
    
    // Check default input values
    expect(screen.getByTestId('seoSettings-seoTitle')).toHaveValue('');
    expect(screen.getByTestId('seoSettings-seoDescription')).toHaveValue('');
    expect(screen.getByTestId('seoSettings-enableCanonicalUrls')).toBeChecked();
    expect(screen.getByTestId('seoSettings-twitterCard')).toHaveValue('summary');
  });

  it('renders with provided initial data', () => {
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      twitterCard: 'summary_large_image'
    };
    
    render(<SEOSettings initialData={initialData} />);
    
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByTestId('seoSettings-seoTitle')).toHaveValue('Test SEO Title');
    expect(screen.getByTestId('seoSettings-seoDescription')).toHaveValue('Test SEO Description');
    expect(screen.getByTestId('seoSettings-twitterCard')).toHaveValue('summary_large_image');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<SEOSettings initialData={{ id: 'site-1' }} onCancel={onCancel} />);
    
    // Click cancel button
    await user.click(screen.getByTestId('seoSettings-cancel'));
    
    // Cancel callback should be called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
