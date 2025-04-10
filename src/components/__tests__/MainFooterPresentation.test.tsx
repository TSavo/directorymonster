import React from 'react';
import { render, screen } from '@testing-library/react';
import { MainFooterPresentation } from '../MainFooterPresentation';

describe('MainFooterPresentation', () => {
  // Mock props for testing
  const mockProps = {
    site: {
      id: 'site-1',
      name: 'Test Site'
    },
    currentYear: 2023,
    socialLinks: [
      {
        name: 'Twitter',
        url: '#',
        ariaLabel: 'Twitter',
        icon: "twitter-icon-path"
      },
      {
        name: 'Facebook',
        url: '#',
        ariaLabel: 'Facebook',
        icon: "facebook-icon-path"
      }
    ],
    quickLinks: [
      { name: 'Home', href: '/' },
      { name: 'About Us', href: '/about' }
    ],
    legalLinks: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' }
    ],
    contactInfo: [
      {
        type: 'email' as const,
        value: 'info@example.com',
        icon: "email-icon-path"
      },
      {
        type: 'phone' as const,
        value: '(123) 456-7890',
        icon: "phone-icon-path"
      }
    ]
  };

  it('renders the site name', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByText('Test Site')).toBeInTheDocument();
  });

  it('renders the copyright with current year', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByTestId('copyright')).toHaveTextContent('© 2023 Test Site');
  });

  it('renders social links', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByTestId('social-link-twitter')).toBeInTheDocument();
    expect(screen.getByTestId('social-link-facebook')).toBeInTheDocument();
  });

  it('renders quick links', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByTestId('quick-link-home')).toHaveTextContent('Home');
    expect(screen.getByTestId('quick-link-about-us')).toHaveTextContent('About Us');
  });

  it('renders legal links', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByTestId('legal-link-privacy-policy')).toHaveTextContent('Privacy Policy');
    expect(screen.getByTestId('legal-link-terms-of-service')).toHaveTextContent('Terms of Service');
  });

  it('renders contact info', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByTestId('contact-email')).toHaveTextContent('info@example.com');
    expect(screen.getByTestId('contact-phone')).toHaveTextContent('(123) 456-7890');
  });

  it('renders the "Powered by" text', () => {
    render(<MainFooterPresentation {...mockProps} />);
    expect(screen.getByText('Powered by')).toBeInTheDocument();
    expect(screen.getByText('DirectoryMonster')).toBeInTheDocument();
  });
});
