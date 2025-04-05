import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Create a simple component that uses a retry function
const ListingsComponent = ({ fetchListings, listings = [], error = null, isLoading = false }) => {

  const handleRetry = () => {
    fetchListings();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div data-testid="error-container">
        <p>{error}</p>
        <button data-testid="retry-button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Listings</h1>
      <ul>
        {listings.map((listing) => (
          <li key={listing.id}>{listing.title}</li>
        ))}
      </ul>
    </div>
  );
};

describe('Simple Error Recovery Test', () => {
  // Mock fetchListings function
  const fetchListings = jest.fn();

  beforeEach(() => {
    // Reset mocks
    fetchListings.mockReset();
  });

  it('should retry when the retry button is clicked', async () => {
    // Render the component with an error state
    render(
      <ListingsComponent
        fetchListings={fetchListings}
        listings={[]}
        error="Failed to load listings"
        isLoading={false}
      />
    );

    // Verify error message is displayed
    expect(screen.getByText('Failed to load listings')).toBeInTheDocument();

    // Verify retry button is present
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();

    // Click the retry button
    fireEvent.click(retryButton);

    // Verify fetchListings was called
    expect(fetchListings).toHaveBeenCalled();
  });
});
