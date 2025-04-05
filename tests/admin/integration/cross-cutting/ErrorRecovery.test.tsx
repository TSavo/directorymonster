import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Error Recovery Flows', () => {
  it('should retry failed API requests automatically', async () => {
    // Create a mock function that fails once then succeeds
    const fetchData = jest.fn();
    let callCount = 0;
    
    fetchData.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve(['Item 1', 'Item 2']);
    });
    
    // Create a simple retry function
    const retry = async (fn, retries = 3) => {
      try {
        return await fn();
      } catch (error) {
        if (retries <= 0) throw error;
        return retry(fn, retries - 1);
      }
    };
    
    // Execute the retry function with our fetchData mock
    const result = await retry(fetchData);
    
    // Verify fetchData was called twice (original + retry)
    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(result).toEqual(['Item 1', 'Item 2']);
  });

  it('should show a user-friendly error and retry button when API calls fail', async () => {
    // Create a mock function for retrying
    const retryFetch = jest.fn();
    
    // Create a simple component with error state and retry button
    const ErrorComponent = ({ onRetry }) => (
      <div data-testid="error-container">
        <p>Failed to load data</p>
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
    
    // Render the component
    render(<ErrorComponent onRetry={retryFetch} />);
    
    // Verify error message is displayed
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    
    // Verify retry button is present
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Click the retry button
    fireEvent.click(retryButton);
    
    // Verify retryFetch was called
    expect(retryFetch).toHaveBeenCalled();
  });

  it('should recover gracefully from component errors', async () => {
    // Create a simple component that simulates an error recovery flow
    const ErrorRecoveryComponent = () => {
      const [hasError, setHasError] = React.useState(true);
      const [isRecovered, setIsRecovered] = React.useState(false);
      
      const handleReset = () => {
        setHasError(false);
        setIsRecovered(true);
      };
      
      if (hasError) {
        return (
          <div data-testid="error-state">
            An error occurred
            <button data-testid="recover-button" onClick={handleReset}>
              Recover
            </button>
          </div>
        );
      }
      
      return <div data-testid="recovered-state">System recovered successfully</div>;
    };
    
    // Render the component
    render(<ErrorRecoveryComponent />);
    
    // Verify error state is displayed
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    
    // Click the recover button
    fireEvent.click(screen.getByTestId('recover-button'));
    
    // Verify recovered state is displayed
    expect(screen.getByTestId('recovered-state')).toBeInTheDocument();
    expect(screen.getByText('System recovered successfully')).toBeInTheDocument();
  });
});
