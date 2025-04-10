import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBarPresentation } from '../SearchBarPresentation';

describe('SearchBarPresentation', () => {
  // Default props for testing
  const defaultProps = {
    searchTerm: '',
    onSearchTermChange: jest.fn(),
    onSubmit: jest.fn(),
    isSearching: false
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with default props', () => {
    // Render the component
    render(<SearchBarPresentation {...defaultProps} />);

    // Check that the component is rendered
    expect(screen.getByTestId('search-form')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-button')).toBeInTheDocument();

    // Check default placeholder
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    // Render the component with custom props
    render(
      <SearchBarPresentation
        {...defaultProps}
        placeholder="Custom placeholder"
        className="custom-class"
        buttonLabel="Search"
      />
    );

    // Check custom placeholder
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();

    // Check custom class
    expect(screen.getByTestId('search-form')).toHaveClass('custom-class');

    // Check custom button label
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('displays the searchTerm in the input', () => {
    // Render the component with a searchTerm
    render(<SearchBarPresentation {...defaultProps} searchTerm="test query" />);

    // Check that the input has the correct value
    expect(screen.getByTestId('search-input')).toHaveValue('test query');
  });

  it('calls onSearchTermChange when input value changes', async () => {
    // Create a mock function
    const onSearchTermChange = jest.fn();

    // Render the component with the mock function
    render(
      <SearchBarPresentation
        {...defaultProps}
        onSearchTermChange={onSearchTermChange}
      />
    );

    const user = userEvent.setup();

    // Type in the input
    await user.type(screen.getByTestId('search-input'), 'test');

    // Check that onSearchTermChange was called
    expect(onSearchTermChange).toHaveBeenCalled();
    // userEvent.type calls onChange for each character, so it's called multiple times
  });

  it('calls onSubmit when form is submitted', async () => {
    // Create a mock function
    const onSubmit = jest.fn();

    // Render the component with the mock function
    render(
      <SearchBarPresentation
        {...defaultProps}
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();

    // Submit the form
    await user.click(screen.getByTestId('search-button'));

    // Check that onSubmit was called
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables input and button when isSearching is true', () => {
    // Render the component with isSearching=true
    render(<SearchBarPresentation {...defaultProps} isSearching={true} />);

    // Check that input and button are disabled
    expect(screen.getByTestId('search-input')).toBeDisabled();
    expect(screen.getByTestId('search-button')).toBeDisabled();
  });
});
