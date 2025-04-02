/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SiteHeader from '../src/components/SiteHeader';
import { SiteConfig } from '../src/types';
import '@testing-library/jest-dom';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, fill }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      data-testid="mocked-image"
    />
  ),
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, className, children }: any) => (
    <a 
      href={href} 
      className={className}
      data-testid="mocked-link"
    >
      {children}
    </a>
  ),
}));

// Mock the LinkUtilities component
jest.mock('../src/components/LinkUtilities', () => ({
  CategoryLink: ({ category, className, children }: any) => (
    <a 
      href={`/mock-category/${category.slug}`} 
      className={className}
      data-testid="mocked-category-link"
      data-category-id={category.id}
    >
      {children}
    </a>
  ),
}));

describe('SiteHeader Component', () => {
  // Define test data
  const mockSite: SiteConfig = {
    id: 'site1',
    name: 'Test Directory',
    slug: 'test-directory',
    domain: 'testdirectory.com',
    primaryKeyword: 'test products',
    metaDescription: 'Test directory description',
    logoUrl: '/images/test-logo.png',
    headerText: 'Find the best test products',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockCategories = [
    { id: 'cat1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat2', name: 'Category 2', slug: 'category-2' },
    { id: 'cat3', name: 'Category 3', slug: 'category-3' }
  ];

  it('renders site name correctly', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    expect(screen.getByText('Test Directory')).toBeInTheDocument();
  });

  it('renders logo when logoUrl is provided', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    const logo = screen.getByTestId('mocked-image');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/test-logo.png');
    expect(logo).toHaveAttribute('alt', 'Test Directory');
  });

  it('does not render logo when logoUrl is not provided', () => {
    const siteWithoutLogo = { ...mockSite, logoUrl: undefined };
    render(<SiteHeader site={siteWithoutLogo} categories={mockCategories} />);
    
    const logo = screen.queryByTestId('mocked-image');
    expect(logo).not.toBeInTheDocument();
  });

  it('renders SEO-optimized H1 tag with headerText', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    const h1 = screen.getByText('Find the best test products');
    expect(h1).toBeInTheDocument();
    expect(h1.tagName).toBe('H1');
    expect(h1).toHaveClass('sr-only');
  });

  it('renders home link correctly', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders all category links correctly', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    // Check that all category names are displayed
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('Category 3')).toBeInTheDocument();
    
    // Check that all category links have correct attributes
    const categoryLinks = screen.getAllByTestId('mocked-category-link');
    expect(categoryLinks.length).toBe(3);
    
    expect(categoryLinks[0]).toHaveAttribute('href', '/mock-category/category-1');
    expect(categoryLinks[0]).toHaveAttribute('data-category-id', 'cat1');
    
    expect(categoryLinks[1]).toHaveAttribute('href', '/mock-category/category-2');
    expect(categoryLinks[1]).toHaveAttribute('data-category-id', 'cat2');
    
    expect(categoryLinks[2]).toHaveAttribute('href', '/mock-category/category-3');
    expect(categoryLinks[2]).toHaveAttribute('data-category-id', 'cat3');
  });

  it('renders correctly with empty categories array', () => {
    render(<SiteHeader site={mockSite} categories={[]} />);
    
    // Should only have the Home link
    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
    
    // Should not have any category links
    const categoryLinks = screen.queryAllByTestId('mocked-category-link');
    expect(categoryLinks.length).toBe(0);
  });

  it('applies correct CSS classes for responsive layout', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    // Check main header container
    const header = document.querySelector('header');
    expect(header).toHaveClass('bg-white shadow-sm');
    
    // Check inner container
    const innerContainer = document.querySelector('.max-w-7xl');
    expect(innerContainer).toHaveClass('mx-auto px-4 sm:px-6 lg:px-8');
    
    // Check site name container
    const nameContainer = document.querySelector('.flex.flex-col');
    expect(nameContainer).toHaveClass('sm:flex-row sm:items-center sm:justify-between py-6');
    
    // Check navigation
    const nav = document.querySelector('nav');
    expect(nav).toHaveClass('py-4 border-t border-gray-100');
    
    // Check navigation list
    const navList = document.querySelector('ul');
    expect(navList).toHaveClass('flex flex-wrap gap-8');
  });

  it('applies correct styling to navigation links', () => {
    render(<SiteHeader site={mockSite} categories={mockCategories} />);
    
    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveClass('text-base font-medium text-gray-600 hover:text-blue-600 transition-colors');
    
    const categoryLinks = screen.getAllByTestId('mocked-category-link');
    categoryLinks.forEach(link => {
      expect(link).toHaveClass('text-base font-medium text-gray-600 hover:text-blue-600 transition-colors');
    });
  });
});
