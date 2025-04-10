/**
 * Custom render utilities for testing
 * 
 * This file provides utilities for rendering components in tests with common providers
 * and testing utilities.
 */

const React = require('react');
const { render: testingLibraryRender, ...testingLibraryRest } = require('@testing-library/react');

/**
 * Custom render function that wraps the component with necessary providers
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Additional options to pass to render
 * @returns {Object} The render result
 */
function renderWithProviders(ui, options = {}) {
  const { 
    wrapper: Wrapper = React.Fragment,
    ...renderOptions 
  } = options;

  return testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      React.createElement(Wrapper, null, children)
    ),
    ...renderOptions
  });
}

/**
 * Custom render function that wraps the component with theme provider
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Additional options to pass to render
 * @returns {Object} The render result
 */
function renderWithTheme(ui, options = {}) {
  // Mock theme provider implementation
  const ThemeProvider = ({ children }) => (
    React.createElement('div', { 'data-testid': 'theme-provider' }, children)
  );

  return renderWithProviders(ui, {
    wrapper: ThemeProvider,
    ...options
  });
}

/**
 * Custom render function that wraps the component with all providers
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Additional options to pass to render
 * @returns {Object} The render result
 */
function renderWithAllProviders(ui, options = {}) {
  // Mock all providers implementation
  const AllProviders = ({ children }) => (
    React.createElement('div', { 'data-testid': 'all-providers' }, children)
  );

  return renderWithProviders(ui, {
    wrapper: AllProviders,
    ...options
  });
}

// Export all functions
module.exports = {
  ...testingLibraryRest,
  render: renderWithProviders,
  renderWithProviders,
  renderWithTheme,
  renderWithAllProviders
};
