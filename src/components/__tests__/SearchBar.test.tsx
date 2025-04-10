import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchBar from '../SearchBar';
import { SearchBarContainer } from '../SearchBarContainer';

// Mock the SearchBarContainer component
jest.mock('../SearchBarContainer', () => ({
  SearchBarContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('SearchBar', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    // Render the search bar
    render(<SearchBar siteId="site-1" />);

    // Check that the container component was rendered
    expect(SearchBarContainer).toHaveBeenCalled();
  });

  it('passes siteId to the container component', () => {
    // Render the search bar with siteId
    render(<SearchBar siteId="site-1" />);

    // Check that the container component was rendered with correct props
    expect(SearchBarContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'site-1'
      }),
      expect.anything()
    );
  });

  it('passes placeholder to the container component', () => {
    // Render the search bar with placeholder
    render(<SearchBar siteId="site-1" placeholder="Custom placeholder" />);

    // Check that the container component was rendered with correct props
    expect(SearchBarContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: 'Custom placeholder'
      }),
      expect.anything()
    );
  });

  it('passes className to the container component', () => {
    // Render the search bar with className
    render(<SearchBar siteId="site-1" className="custom-class" />);

    // Check that the container component was rendered with correct props
    expect(SearchBarContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'custom-class'
      }),
      expect.anything()
    );
  });

  it('passes buttonLabel to the container component', () => {
    // Render the search bar with buttonLabel
    const buttonLabel = <span>Search</span>;
    render(<SearchBar siteId="site-1" buttonLabel={buttonLabel} />);

    // Check that the container component was rendered with correct props
    expect(SearchBarContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        buttonLabel
      }),
      expect.anything()
    );
  });
});
