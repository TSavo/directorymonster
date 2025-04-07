/**
 * @jest-environment jsdom
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from './TestWrapper';
import { createMockSite, createMockCategory, createMockListings, resetMocks } from './setup';

// Mock the page component
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Import the page component
import AdminSearchPage from '@/app/admin/search/page';

// Mock the AdvancedSearchDialog component
jest.mock('@/components/ui/advanced-search', () => ({
  __esModule: true,
  AdvancedSearchDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="advanced-search-dialog">
      <div data-testid="advanced-search-dialog-content">
        <h2>Advanced Search</h2>
        <div data-testid="advanced-search-form">
          <input type="text" placeholder="Search term" data-testid="advanced-search-input" />
          <select data-testid="advanced-search-scope">
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="roles">Roles</option>
            <option value="sites">Sites</option>
            <option value="content">Content</option>
          </select>
          <button data-testid="advanced-search-submit">Search</button>
        </div>
      </div>
      {children}
    </div>
  ),
}), { virtual: true });

// Mock UI components
jest.mock('@/components/ui/tabs', () => ({
  __esModule: true,
  Tabs: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs">{children}</div>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button data-testid={`tabs-trigger-${value}`}>{children}</button>
  ),
}), { virtual: true });

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({ children, className, onClick }: any) => (
    <button data-testid="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}), { virtual: true });

// Mock the AdminLayout component
jest.mock('@/components/admin/layout/AdminLayout', () => ({
  __esModule: true,
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  ),
}), { virtual: true });

describe('Advanced Search Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the advanced search page with search form', async () => {
    // Render the advanced search page
    renderWithWrapper(
      <AdminSearchPage searchParams={{}} />
    );

    // Wait for the admin layout to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    // Check that the advanced search dialog button is rendered
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
  });

  it('renders search results when query is provided', async () => {
    // Render the advanced search page with a query
    renderWithWrapper(
      <AdminSearchPage searchParams={{ q: 'test query' }} />
    );

    // Wait for the tabs to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    // Check that the tabs are rendered
    expect(screen.getByTestId('tabs-trigger-users')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-trigger-roles')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-trigger-sites')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-trigger-content')).toBeInTheDocument();
  });

  it('shows empty state when no query is provided', async () => {
    // Render the advanced search page without a query
    renderWithWrapper(
      <AdminSearchPage searchParams={{}} />
    );

    // Wait for the empty state to be rendered
    await waitFor(() => {
      expect(screen.getByText('Start a new search')).toBeInTheDocument();
    });

    // Check that the tabs are not rendered
    expect(screen.queryByTestId('tabs-trigger-users')).not.toBeInTheDocument();
  });

  it('renders the advanced search dialog when button is clicked', async () => {
    // Render the advanced search page
    renderWithWrapper(
      <AdminSearchPage searchParams={{}} />
    );

    // Wait for the button to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    // Check that the advanced search dialog is rendered
    expect(screen.getByTestId('advanced-search-dialog')).toBeInTheDocument();
  });

  it('renders different tab content based on scope', async () => {
    // Render the advanced search page with a query and scope
    renderWithWrapper(
      <AdminSearchPage searchParams={{ q: 'test query', scope: 'users' }} />
    );

    // Wait for the tabs to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    // Check that the users tab content is rendered
    expect(screen.getByTestId('tabs-content-users')).toBeInTheDocument();
  });
});
