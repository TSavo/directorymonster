import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteForm from '@/components/admin/sites/SiteForm';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the useNotificationsContext hook
jest.mock('@/components/notifications/NotificationProvider', () => ({
  useNotificationsContext: () => ({
    showNotification: jest.fn()
  })
}));

// Mock the useSites hook
jest.mock('@/components/admin/sites/hooks', () => ({
  useSites: () => ({
    site: {
      id: '',
      name: '',
      slug: '',
      description: '',
      domains: [],
      theme: 'default',
      customStyles: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      enableCanonicalUrls: false
    },
    updateSite: jest.fn(),
    createSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'site-1' } }),
    saveSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'site-1' } }),
    isLoading: false,
    error: null,
    success: null,
    errors: {},
    validateSite: jest.fn().mockReturnValue(true),
    resetErrors: jest.fn()
  })
}));

describe('SiteForm', () => {
  it('renders the form with correct title in create mode', () => {
    render(<SiteForm mode="create" />);

    // Check heading
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');

    // Check that form is rendered
    expect(screen.getByTestId('siteForm-form')).toBeInTheDocument();
  });

  it('renders the form with correct title in edit mode', () => {
    render(<SiteForm mode="edit" />);

    // Check heading
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Edit Site');
  });
});
