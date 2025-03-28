/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '../src/app/admin/page';
import '@testing-library/jest-dom';

// Mock useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AdminDashboard Component', () => {
  it('renders the page title correctly', () => {
    render(<AdminDashboard />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Admin Dashboard');
  });

  it('renders the site panel with correct heading', () => {
    render(<AdminDashboard />);
    
    const siteHeading = screen.getByRole('heading', { name: 'Your Directory Sites' });
    expect(siteHeading).toBeInTheDocument();
  });

  it('displays "No sites created yet" message when no sites exist', () => {
    render(<AdminDashboard />);
    
    const noSitesMessage = screen.getByText('No sites created yet.');
    expect(noSitesMessage).toBeInTheDocument();
  });

  it('renders the "Create New SEO Site" button', () => {
    render(<AdminDashboard />);
    
    const createButton = screen.getByRole('button', { name: 'Create New SEO Site' });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveClass('bg-blue-500');
  });

  it('renders the stats panel with correct heading', () => {
    render(<AdminDashboard />);
    
    const statsHeading = screen.getByRole('heading', { name: 'Platform Stats' });
    expect(statsHeading).toBeInTheDocument();
  });

  it('displays the correct default stats values', () => {
    render(<AdminDashboard />);
    
    const totalSites = screen.getByText('Total Sites: 0');
    const totalListings = screen.getByText('Total Listings: 0');
    const totalBacklinks = screen.getByText('Total Backlinks: 0');
    
    expect(totalSites).toBeInTheDocument();
    expect(totalListings).toBeInTheDocument();
    expect(totalBacklinks).toBeInTheDocument();
  });

  it('applies correct grid layout for responsive design', () => {
    render(<AdminDashboard />);
    
    const gridContainer = screen.getByText('Admin Dashboard').closest('main')!.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1 md:grid-cols-2 gap-6');
  });

  it('applies proper styling to the panels', () => {
    render(<AdminDashboard />);
    
    const panels = document.querySelectorAll('.border.rounded.p-4');
    expect(panels.length).toBe(2);
    
    // Panel headings should have appropriate styling
    const panelHeadings = document.querySelectorAll('.text-xl.font-semibold.mb-3');
    expect(panelHeadings.length).toBe(2);
  });

  it('ensures main container has proper padding', () => {
    render(<AdminDashboard />);
    
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('p-8');
  });

  it('applies correct spacing to stats list items', () => {
    render(<AdminDashboard />);
    
    const statsContainer = screen.getByText('Platform Stats').closest('div')!.querySelector('.space-y-2');
    expect(statsContainer).toBeInTheDocument();
  });
});
