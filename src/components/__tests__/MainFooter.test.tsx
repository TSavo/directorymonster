import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainFooter from '../MainFooter';

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
});

describe('MainFooter Component', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
  };

  it('renders the footer with site name', () => {
    render(<MainFooter site={mockSite} />);

    expect(screen.getByTestId('main-footer')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
  });

  it('displays the current year in the copyright notice', () => {
    const currentYear = new Date().getFullYear();
    render(<MainFooter site={mockSite} />);

    expect(screen.getByText(`© ${currentYear} Test Site. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders all quick links', () => {
    render(<MainFooter site={mockSite} />);

    expect(screen.getByText('Quick Links')).toBeInTheDocument();

    // Check that all links are present
    const links = ['Home', 'About Us', 'Contact', 'Privacy Policy', 'Terms of Service'];
    links.forEach(linkText => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });

  it('renders contact information', () => {
    render(<MainFooter site={mockSite} />);

    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('info@example.com')).toBeInTheDocument();
    expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    expect(screen.getByText('123 Directory St, City, Country')).toBeInTheDocument();
  });

  it('applies correct CSS classes for responsive layout', () => {
    render(<MainFooter site={mockSite} />);

    // Check footer container
    const footer = screen.getByTestId('main-footer');
    expect(footer).toHaveClass('bg-gradient-to-r from-primary-900 to-primary-950 text-white py-16');

    // Check grid layout
    const grid = footer.querySelector('.grid');
    expect(grid).toHaveClass('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12');

    // Check copyright section
    const copyright = footer.querySelector('.border-t');
    expect(copyright).toHaveClass('border-t border-primary-800/50 mt-12 pt-8 text-center text-neutral-400');
  });
});
