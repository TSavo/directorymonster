import React from 'react';
import { render } from '@testing-library/react';
import { MainFooterContainer } from '../MainFooterContainer';
import { useMainFooter } from '../hooks/useMainFooter';
import { MainFooterPresentation } from '../MainFooterPresentation';

// Mock the hook
jest.mock('../hooks/useMainFooter');

// Mock the presentation component
jest.mock('../MainFooterPresentation', () => ({
  MainFooterPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('MainFooterContainer', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site'
  };

  const mockHookReturn = {
    site: mockSite,
    currentYear: 2023,
    socialLinks: [{ name: 'Twitter', url: '#', ariaLabel: 'Twitter', icon: 'test-icon' }],
    quickLinks: [{ name: 'Home', href: '/' }],
    legalLinks: [{ name: 'Privacy Policy', href: '/privacy' }],
    contactInfo: [{ type: 'email' as const, value: 'info@example.com', icon: 'test-icon' }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMainFooter as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('passes site to the hook', () => {
    render(<MainFooterContainer site={mockSite} />);
    expect(useMainFooter).toHaveBeenCalledWith({ site: mockSite });
  });

  it('passes hook results to the presentation component', () => {
    render(<MainFooterContainer site={mockSite} />);
    expect(MainFooterPresentation).toHaveBeenCalledWith(
      expect.objectContaining(mockHookReturn),
      expect.anything()
    );
  });
});
