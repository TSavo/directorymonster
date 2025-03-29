import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('SEOSettings Noindex Pages Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('allows adding noindex pages', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Initial state should show no pages message
    expect(screen.getByText('No pages excluded from indexing')).toBeInTheDocument();
    
    // Add a valid path
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), '/test-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));
    
    // Check path is added and displayed
    expect(screen.queryByText('No pages excluded from indexing')).not.toBeInTheDocument();
    expect(screen.getByTestId('seoSettings-noindexPage-0')).toHaveTextContent('/test-path');
    
    // Add another path
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), '/another-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));
    
    // Check both paths are displayed
    expect(screen.getByTestId('seoSettings-noindexPage-0')).toHaveTextContent('/test-path');
    expect(screen.getByTestId('seoSettings-noindexPage-1')).toHaveTextContent('/another-path');
  });

  it('validates noindex path must start with /', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Try to add invalid path (without leading slash)
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), 'invalid-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));
    
    // Check error message is displayed
    expect(screen.getByText('Path must start with /')).toBeInTheDocument();
    
    // No path should be added
    expect(screen.getByText('No pages excluded from indexing')).toBeInTheDocument();
  });

  it('prevents adding duplicate noindex paths', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add a valid path
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), '/test-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));
    
    // Try to add the same path again
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), '/test-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));
    
    // Check error message is displayed
    expect(screen.getByText('This path is already added')).toBeInTheDocument();
    
    // Only one path should exist
    expect(screen.getAllByText('/test-path')).toHaveLength(1);
  });

  it('allows removing noindex pages', async () => {
    const user = userEvent.setup();
    
    // Initial data with existing noindex pages
    const initialData = {
      id: 'site-1',
      noindexPages: ['/path1', '/path2', '/path3']
    };
    
    render(<SEOSettings initialData={initialData} />);
    
    // Verify all paths are displayed
    expect(screen.getByText('/path1')).toBeInTheDocument();
    expect(screen.getByText('/path2')).toBeInTheDocument();
    expect(screen.getByText('/path3')).toBeInTheDocument();
    
    // Get remove buttons (using the closest parent LI element since buttons don't have test IDs)
    const removeButtons = screen.getAllByRole('button', { name: /remove path/i });
    
    // Remove second path
    await user.click(removeButtons[1]);
    
    // Check it was removed
    expect(screen.getByText('/path1')).toBeInTheDocument();
    expect(screen.queryByText('/path2')).not.toBeInTheDocument();
    expect(screen.getByText('/path3')).toBeInTheDocument();
  });

  it('renders with pre-populated noindex pages', () => {
    const initialData = {
      id: 'site-1',
      noindexPages: ['/admin', '/private']
    };
    
    render(<SEOSettings initialData={initialData} />);
    
    // Check paths are displayed
    expect(screen.getByTestId('seoSettings-noindexPage-0')).toHaveTextContent('/admin');
    expect(screen.getByTestId('seoSettings-noindexPage-1')).toHaveTextContent('/private');
  });

  it('maintains empty input after adding a path', async () => {
    const user = userEvent.setup();
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Add a path
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), '/test-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));
    
    // Input should be cleared
    expect(screen.getByTestId('seoSettings-newNoindexPage')).toHaveValue('');
  });
});
