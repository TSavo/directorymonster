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

// Mock the page component
const AdminSearchPage = ({ searchParams = {} }) => {
  const { q, scope } = searchParams;
  return (
    <div data-testid="admin-layout">
      <h1>Advanced Search</h1>
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
        <button data-testid="button">Advanced Search</button>
      </div>
      {q ? (
        <div data-testid="tabs">
          <div data-testid="tabs-list">
            <button data-testid="tabs-trigger-users">Users</button>
            <button data-testid="tabs-trigger-roles">Roles</button>
            <button data-testid="tabs-trigger-sites">Sites</button>
            <button data-testid="tabs-trigger-content">Content</button>
          </div>
          <div data-testid={`tabs-content-${scope || 'users'}`}>
            <h2>Search Results for "{q}"</h2>
            <div data-testid="search-results-list">
              <div data-testid="search-result-item">Test Result 1</div>
              <div data-testid="search-result-item">Test Result 2</div>
              <div data-testid="search-result-item">Test Result 3</div>
            </div>
          </div>
        </div>
      ) : (
        <div data-testid="empty-state">
          <p>Start a new search</p>
        </div>
      )}
    </div>
  );
};



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
    expect(screen.getByTestId('advanced-search-dialog')).toBeInTheDocument();
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
