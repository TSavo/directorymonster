import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivitySearch } from '../ActivitySearch';

describe('ActivitySearch', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: jest.fn(),
    onSearch: jest.fn()
  };

  it('renders the search input and button', () => {
    render(<ActivitySearch {...mockProps} />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-button')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by username or user ID')).toBeInTheDocument();
  });

  it('calls onSearchChange when input value changes', () => {
    render(<ActivitySearch {...mockProps} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test-user' } });

    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test-user');
  });

  it('calls onSearch when search button is clicked', () => {
    render(<ActivitySearch {...mockProps} />);

    const button = screen.getByTestId('search-button');
    fireEvent.click(button);

    expect(mockProps.onSearch).toHaveBeenCalled();
  });

  it('calls onSearch when Enter key is pressed in the input', () => {
    render(<ActivitySearch {...mockProps} />);

    const input = screen.getByTestId('search-input');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockProps.onSearch).toHaveBeenCalled();
  });

  it('does not call onSearch when other keys are pressed in the input', () => {
    const localMockProps = {
      searchTerm: '',
      onSearchChange: jest.fn(),
      onSearch: jest.fn()
    };

    render(<ActivitySearch {...localMockProps} />);

    const input = screen.getByTestId('search-input');
    fireEvent.keyDown(input, { key: 'a' });

    expect(localMockProps.onSearch).not.toHaveBeenCalled();
  });

  it('displays the current search term in the input', () => {
    const propsWithSearchTerm = {
      ...mockProps,
      searchTerm: 'existing-search'
    };

    render(<ActivitySearch {...propsWithSearchTerm} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input.value).toBe('existing-search');
  });
});
