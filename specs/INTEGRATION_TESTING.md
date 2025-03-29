# Integration Testing

This document outlines the integration testing approach for the DirectoryMonster application, focusing on testing interactions between multiple components and ensuring proper data flow through the system.

## Table of Contents

1. [Integration Test Types](#integration-test-types)
2. [Setup and Configuration](#setup-and-configuration)
3. [Multitenancy Testing](#multitenancy-testing)
4. [End-to-End Flows](#end-to-end-flows)
5. [Domain Resolution Testing](#domain-resolution-testing)
6. [Examples](#examples)

## Integration Test Types

DirectoryMonster employs several types of integration tests:

### 1. Component Integration Tests

These tests verify that multiple React components work correctly together, including proper prop passing, event handling, and state management between components.

### 2. API Integration Tests

These tests verify that API endpoints work correctly with the data layer, Redis client, and other services, ensuring proper data storage and retrieval.

### 3. Multitenancy Tests

These tests verify that the application correctly handles multiple sites with different domains, ensuring each site only displays its own content.

### 4. Domain Resolution Tests

These tests verify that the application correctly resolves domain names to the appropriate sites, including hostname normalization and subdomain handling.

### 5. End-to-End Flow Tests

These tests walk through complete user workflows, simulating actual user interactions and ensuring the application behaves correctly at each step.

## Setup and Configuration

### Test Environment

Integration tests require a more complete environment than unit tests. The recommended setup is:

```typescript
// Import the required modules
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

// Create a test wrapper component that provides context
const TestWrapper = ({ children, initialState = {} }) => {
  const [state, setState] = useState(initialState);
  
  return (
    <TestContext.Provider value={{ state, setState }}>
      {children}
    </TestContext.Provider>
  );
};

// Use the wrapper in tests
const renderWithContext = (ui, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;
  
  return render(
    <TestWrapper initialState={initialState}>{ui}</TestWrapper>,
    renderOptions
  );
};
```

### Data Seeding

For tests that require data to be available in the application:

```javascript
// Import the seed function
import { seedTestData } from '@/scripts/seed';

// Seed the test data before running tests
beforeAll(async () => {
  await seedTestData();
});

// Clean up after tests
afterAll(async () => {
  await cleanupTestData();
});
```

### Redis Configuration

For integration tests that require Redis:

```javascript
// Configure Redis with in-memory fallback for testing
jest.mock('@/lib/redis-client', () => {
  const originalModule = jest.requireActual('@/lib/redis-client');
  
  return {
    ...originalModule,
    USE_MEMORY_FALLBACK: true
  };
});
```

## Multitenancy Testing

Multitenancy tests verify that the application correctly handles multiple sites with different domains.

### Example Multitenancy Test

```typescript
import { renderWithSite } from '../test-utils/render-with-site';

describe('Multitenancy Tests', () => {
  it('shows correct site content based on hostname', async () => {
    // Test with site 1
    const { unmount: unmountSite1 } = renderWithSite(<HomePage />, {
      hostname: 'site1.example.com'
    });
    
    // Check site 1 content
    expect(screen.getByTestId('site-name')).toHaveTextContent('Site 1');
    expect(screen.getByTestId('site-logo')).toHaveAttribute('src', '/site1-logo.png');
    
    // Unmount site 1
    unmountSite1();
    
    // Test with site 2
    renderWithSite(<HomePage />, {
      hostname: 'site2.example.com'
    });
    
    // Check site 2 content
    expect(screen.getByTestId('site-name')).toHaveTextContent('Site 2');
    expect(screen.getByTestId('site-logo')).toHaveAttribute('src', '/site2-logo.png');
  });
  
  it('correctly routes to site-specific pages', async () => {
    const user = userEvent.setup();
    
    // Render with site 1
    renderWithSite(<NavBar />, {
      hostname: 'site1.example.com'
    });
    
    // Click on a category link
    await user.click(screen.getByText('Categories'));
    
    // Verify the URL includes the site slug
    expect(mockRouter.push).toHaveBeenCalledWith('/site1/categories');
  });
});
```

## End-to-End Flows

End-to-end flow tests simulate complete user workflows, verifying that multiple system components work together correctly. These tests typically cover scenarios like:

- User registration and login
- Creating and managing content
- Navigating between pages
- Form submissions and data validation
- Error handling and recovery

### Example End-to-End Flow Test

```typescript
describe('Listing Management Flow', () => {
  // Set up user for interactions
  const user = userEvent.setup();
  
  // Mock Redis
  beforeEach(() => {
    jest.clearAllMocks();
    const redisClient = require('@/lib/redis-client').getClient();
    
    // Mock authentication
    redisClient.get.mockImplementation((key) => {
      if (key.includes('user:')) {
        return Promise.resolve(JSON.stringify({ id: 'admin', role: 'admin' }));
      }
      if (key.includes('site:')) {
        return Promise.resolve(JSON.stringify({ id: 'test-site', name: 'Test Site' }));
      }
      if (key.includes('categories:')) {
        return Promise.resolve(JSON.stringify([
          { id: 'cat-1', name: 'Category 1' },
          { id: 'cat-2', name: 'Category 2' }
        ]));
      }
      if (key.includes('listings:')) {
        return Promise.resolve(JSON.stringify([]));
      }
      return Promise.resolve(null);
    });
    
    // Handle setting data
    redisClient.set.mockResolvedValue('OK');
  });
  
  it('completes the full listing creation flow', async () => {
    // Render the admin dashboard
    renderWithAuth(<AdminDashboard />, {
      user: { id: 'admin', role: 'admin' }
    });
    
    // Navigate to listings
    await user.click(screen.getByText('Listings'));
    
    // Click "Create New Listing" button
    await user.click(screen.getByRole('button', { name: /create new listing/i }));
    
    // Fill out the form
    await user.type(screen.getByLabelText(/title/i), 'New Test Listing');
    await user.type(screen.getByLabelText(/description/i), 'This is a test listing');
    await user.type(screen.getByLabelText(/price/i), '99.99');
    
    // Select a category
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByText('Category 1'));
    
    // Set features
    await user.click(screen.getByLabelText(/featured/i));
    
    // Upload an image (mock file upload)
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    await user.click(screen.getByRole('button', { name: /upload/i }));
    
    // Wait for upload confirmation
    await waitFor(() => {
      expect(screen.getByText(/image uploaded/i)).toBeInTheDocument();
    });
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/listing created successfully/i)).toBeInTheDocument();
    });
    
    // Check that we're redirected to the listings page
    expect(screen.getByTestId('listings-table')).toBeInTheDocument();
    
    // Verify the new listing appears in the table
    expect(screen.getByText('New Test Listing')).toBeInTheDocument();
    
    // Click on the listing to view details
    await user.click(screen.getByText('New Test Listing'));
    
    // Verify details page shows correct information
    expect(screen.getByText('This is a test listing')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByAltText('Listing Image')).toBeInTheDocument();
    
    // Click edit button
    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    // Update the description
    const descriptionField = screen.getByLabelText(/description/i);
    await user.clear(descriptionField);
    await user.type(descriptionField, 'Updated description');
    
    // Save changes
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/listing updated successfully/i)).toBeInTheDocument();
    });
    
    // Verify the updated description appears
    expect(screen.getByText('Updated description')).toBeInTheDocument();
    
    // Delete the listing
    await user.click(screen.getByRole('button', { name: /delete/i }));
    
    // Confirm deletion
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/listing deleted successfully/i)).toBeInTheDocument();
    });
    
    // Verify we're back at the listings table
    expect(screen.getByTestId('listings-table')).toBeInTheDocument();
    
    // Verify the listing is no longer in the table
    expect(screen.queryByText('New Test Listing')).not.toBeInTheDocument();
  });
});
```

## Domain Resolution Testing

Domain resolution tests verify that the application correctly identifies sites based on the hostname.

### Testing Domain Normalization

```typescript
import { normalizeDomain, getSiteFromDomain } from '@/lib/site-utils';

describe('Domain Resolution Tests', () => {
  it('normalizes domains correctly', () => {
    expect(normalizeDomain('example.com')).toBe('example.com');
    expect(normalizeDomain('www.example.com')).toBe('example.com');
    expect(normalizeDomain('http://example.com')).toBe('example.com');
    expect(normalizeDomain('https://www.example.com')).toBe('example.com');
    expect(normalizeDomain('example.com/')).toBe('example.com');
    expect(normalizeDomain('example.com/page')).toBe('example.com');
    expect(normalizeDomain('sub.example.com')).toBe('sub.example.com');
  });
  
  it('resolves domains to the correct site', async () => {
    // Mock Redis client
    const redisClient = require('@/lib/redis-client').getClient();
    redisClient.get.mockImplementation((key) => {
      if (key === 'domain:example.com') {
        return Promise.resolve('site-1');
      }
      if (key === 'domain:sub.example.com') {
        return Promise.resolve('site-2');
      }
      if (key === 'site:site-1') {
        return Promise.resolve(JSON.stringify({
          id: 'site-1',
          name: 'Example Site',
          domains: ['example.com']
        }));
      }
      if (key === 'site:site-2') {
        return Promise.resolve(JSON.stringify({
          id: 'site-2',
          name: 'Subdomain Site',
          domains: ['sub.example.com']
        }));
      }
      return Promise.resolve(null);
    });
    
    // Test domain resolution
    const site1 = await getSiteFromDomain('example.com');
    expect(site1.id).toBe('site-1');
    expect(site1.name).toBe('Example Site');
    
    const site2 = await getSiteFromDomain('sub.example.com');
    expect(site2.id).toBe('site-2');
    expect(site2.name).toBe('Subdomain Site');
    
    // Test www prefix normalization
    const site1WithWww = await getSiteFromDomain('www.example.com');
    expect(site1WithWww.id).toBe('site-1');
    
    // Test with protocol and path
    const site1WithProtocol = await getSiteFromDomain('https://example.com/page');
    expect(site1WithProtocol.id).toBe('site-1');
  });
  
  it('handles unknown domains gracefully', async () => {
    // Mock Redis client for unknown domain
    const redisClient = require('@/lib/redis-client').getClient();
    redisClient.get.mockResolvedValue(null);
    
    // Test with unknown domain
    const result = await getSiteFromDomain('unknown.com');
    expect(result).toBeNull();
  });
});
```

### HTTP Domain Testing

For testing with actual HTTP requests:

```javascript
// This test requires a running server
describe('Domain HTTP Tests', () => {
  let server;
  
  beforeAll(async () => {
    // Start server
    server = await startTestServer();
    // Seed test data
    await seedTestData();
  });
  
  afterAll(async () => {
    // Shut down server
    await server.close();
  });
  
  it('serves different content based on hostname', async () => {
    // Make request with site1 hostname
    const response1 = await fetch('http://localhost:3000', {
      headers: {
        'Host': 'site1.example.com'
      }
    });
    const html1 = await response1.text();
    
    // Verify site1 content
    expect(html1).toContain('Site 1');
    expect(html1).not.toContain('Site 2');
    
    // Make request with site2 hostname
    const response2 = await fetch('http://localhost:3000', {
      headers: {
        'Host': 'site2.example.com'
      }
    });
    const html2 = await response2.text();
    
    // Verify site2 content
    expect(html2).toContain('Site 2');
    expect(html2).not.toContain('Site 1');
  });
  
  it('handles unknown domains with default site', async () => {
    // Make request with unknown hostname
    const response = await fetch('http://localhost:3000', {
      headers: {
        'Host': 'unknown.example.com'
      }
    });
    
    // Should redirect to default site or show default content
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Welcome to DirectoryMonster');
  });
});
```

## Examples

### Example 1: Testing Site Authentication Flow

```typescript
describe('Site Authentication Flow', () => {
  // Set up user for interactions
  const user = userEvent.setup();
  
  // Mock authentication service
  jest.mock('@/lib/auth', () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn()
  }));
  
  const { signIn, signOut, getSession } = require('@/lib/auth');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to no session
    getSession.mockResolvedValue(null);
  });
  
  it('completes the full authentication flow', async () => {
    // Mock successful sign-in
    signIn.mockResolvedValueOnce({
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    });
    
    // Render login page
    render(<LoginPage />);
    
    // Fill in the login form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify signIn was called with correct credentials
    expect(signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/signed in successfully/i)).toBeInTheDocument();
    });
    
    // Mock successful session for dashboard
    getSession.mockResolvedValue({
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
    });
    
    // Navigate to dashboard (or mount dashboard directly)
    render(<Dashboard />);
    
    // Verify user info is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    // Click sign out button
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    
    // Verify signOut was called
    expect(signOut).toHaveBeenCalled();
    
    // Verify we're redirected to login page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });
  
  it('handles authentication errors', async () => {
    // Mock failed sign-in
    signIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    // Render login page
    render(<LoginPage />);
    
    // Fill in the login form with invalid credentials
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    
    // Form should still be available
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  it('redirects unauthenticated users from protected pages', async () => {
    // Mock no session (unauthenticated)
    getSession.mockResolvedValue(null);
    
    // Render a protected page
    render(<AdminDashboard />);
    
    // Verify we're redirected to login page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/you must be signed in/i)).toBeInTheDocument();
    });
  });
});
```

### Example 2: Testing Multi-Step Form Flow

```typescript
describe('Listing Creation Wizard', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API endpoints
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'cat-1', name: 'Category 1' },
            { id: 'cat-2', name: 'Category 2' }
          ])
        });
      }
      if (url.includes('/api/listings') && url.includes('POST')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'listing-123', success: true })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Unexpected URL' })
      });
    });
  });
  
  it('completes all steps of the wizard', async () => {
    // Render the multi-step form
    render(<ListingWizard />);
    
    // Step 1: Basic Information
    expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument();
    
    // Fill basic info
    await user.type(screen.getByLabelText(/title/i), 'Test Listing');
    await user.type(screen.getByLabelText(/summary/i), 'This is a test');
    
    // Navigate to next step
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 2: Details
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument();
    });
    
    // Fill details
    await user.type(screen.getByLabelText(/price/i), '99.99');
    await user.type(screen.getByLabelText(/description/i), 'Detailed description');
    
    // Select category
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByText('Category 1'));
    
    // Navigate to next step
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 3: Media
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-3')).toBeInTheDocument();
    });
    
    // Mock file upload
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    await user.click(screen.getByRole('button', { name: /upload/i }));
    
    // Wait for upload confirmation
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });
    
    // Navigate to next step
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 4: Review
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-4')).toBeInTheDocument();
    });
    
    // Verify summary shows correct information
    expect(screen.getByText('Test Listing')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Wait for successful submission
    await waitFor(() => {
      expect(screen.getByText(/listing created successfully/i)).toBeInTheDocument();
    });
    
    // Verify API was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/listings'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
    
    // Verify body contains correct data
    const lastCallBody = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(lastCallBody).toEqual({
      title: 'Test Listing',
      summary: 'This is a test',
      price: '99.99',
      description: 'Detailed description',
      categoryId: 'cat-1',
      images: expect.arrayContaining([expect.any(String)])
    });
  });
  
  it('allows navigation back to previous steps', async () => {
    // Render the multi-step form
    render(<ListingWizard />);
    
    // Step 1: Fill basic info and go to step 2
    await user.type(screen.getByLabelText(/title/i), 'Test Listing');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Verify we're on step 2
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument();
    });
    
    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    
    // Verify we're back on step 1 and data is preserved
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Listing');
  });
  
  it('validates form data at each step', async () => {
    // Render the multi-step form
    render(<ListingWizard />);
    
    // Try to go to next step without filling required fields
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Verify validation errors
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    
    // Fill title but not summary
    await user.type(screen.getByLabelText(/title/i), 'Test Listing');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Verify we're still on step 1 with a different error
    expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument();
    expect(screen.getByText(/summary is required/i)).toBeInTheDocument();
  });
});
```
