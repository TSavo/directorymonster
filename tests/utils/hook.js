/**
 * Custom hook testing utilities
 * 
 * This file provides utilities for testing React hooks with improved support
 * for waitForNextUpdate and async testing.
 */

const React = require('react');
const { act, waitForNextUpdate } = require('./testing-library-hooks-fix');

/**
 * Renders a hook and returns a result object with helpful methods
 * 
 * @param {Function} callback - The hook to render
 * @param {Object} options - Additional options
 * @returns {Object} The render result
 */
function renderHook(callback, options = {}) {
  // Create a wrapper with the requested providers if provided
  let Wrapper = options.wrapper || (({ children }) => children);

  // Initial render of the hook
  let current;
  let hookError = null;

  // Create a test component that will call our hook
  const TestComponent = props => {
    try {
      current = callback(props);
    } catch (error) {
      hookError = error;
    }
    return null;
  };

  // Render the test component
  const { unmount } = require('@testing-library/react').render(
    React.createElement(Wrapper, {}, React.createElement(TestComponent, options.initialProps || {}))
  );

  // Throw any errors that occurred during rendering
  if (hookError) {
    throw hookError;
  }

  // Create a result object
  const result = {
    current,
    // Wait for next update
    waitForNextUpdate: async (timeout = 5000) => {
      return waitForNextUpdate(timeout);
    },
    // Re-render with new props
    rerender: (newProps) => {
      act(() => {
        require('@testing-library/react').render(
          React.createElement(Wrapper, {}, React.createElement(TestComponent, newProps || options.initialProps || {}))
        );
      });
      return result;
    },
    // Unmount the component
    unmount: () => {
      act(() => {
        unmount();
      });
    }
  };

  return result;
}

module.exports = {
  renderHook,
  act,
  waitForNextUpdate
};
