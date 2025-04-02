/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../src/app/admin/page';
import '@testing-library/jest-dom';

// Mock the StatisticCards and ActivityFeed components
jest.mock('@/components/admin/dashboard', () => ({
  StatisticCards: () => <div data-testid="statistics-section">Statistics Cards Mock</div>,
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed Mock</div>,
}));

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
    expect(heading).toHaveTextContent('Dashboard');
  });

  it('renders the StatisticCards component', () => {
    render(<AdminDashboard />);

    const statisticsSection = screen.getByTestId('statistics-section');
    expect(statisticsSection).toBeInTheDocument();
  });

  it('renders the Recent Activity section with correct heading', () => {
    render(<AdminDashboard />);

    const activityHeading = screen.getByRole('heading', { name: 'Recent Activity' });
    expect(activityHeading).toBeInTheDocument();
  });

  it('renders the ActivityFeed component', () => {
    render(<AdminDashboard />);

    const activityFeed = screen.getByTestId('activity-feed');
    expect(activityFeed).toBeInTheDocument();
  });

  it('renders the Quick Actions section with correct heading', () => {
    render(<AdminDashboard />);

    const quickActionsHeading = screen.getByRole('heading', { name: 'Quick Actions' });
    expect(quickActionsHeading).toBeInTheDocument();
  });

  it('renders the quick action links', () => {
    render(<AdminDashboard />);

    const addListingLink = screen.getByText('Add New Listing');
    const addCategoryLink = screen.getByText('Add New Category');
    const createSiteLink = screen.getByText('Create New Site');
    const systemSettingsLink = screen.getByText('System Settings');

    expect(addListingLink).toBeInTheDocument();
    expect(addCategoryLink).toBeInTheDocument();
    expect(createSiteLink).toBeInTheDocument();
    expect(systemSettingsLink).toBeInTheDocument();

    expect(addListingLink.closest('a')).toHaveAttribute('href', '/admin/listings/new');
    expect(addCategoryLink.closest('a')).toHaveAttribute('href', '/admin/categories/new');
    expect(createSiteLink.closest('a')).toHaveAttribute('href', '/admin/sites/new');
    expect(systemSettingsLink.closest('a')).toHaveAttribute('href', '/admin/settings');
  });

  it('applies correct grid layout for responsive design', () => {
    render(<AdminDashboard />);

    const gridContainer = screen.getByText('Recent Activity').closest('div')!.parentElement;
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
    expect(gridContainer).toHaveClass('gap-6');
  });

  it('applies proper styling to the Quick Actions panel', () => {
    render(<AdminDashboard />);

    const quickActionsPanel = screen.getByText('Quick Actions').nextElementSibling;
    expect(quickActionsPanel).toHaveClass('bg-white');
    expect(quickActionsPanel).toHaveClass('rounded-lg');
    expect(quickActionsPanel).toHaveClass('shadow');
    expect(quickActionsPanel).toHaveClass('border');
    expect(quickActionsPanel).toHaveClass('border-gray-100');
  });
});
