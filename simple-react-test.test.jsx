import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple React component
function SimpleComponent({ text }) {
  return <div data-testid="simple-component">{text}</div>;
}

// Test for the component
test('renders SimpleComponent correctly', () => {
  render(<SimpleComponent text="Hello, world!" />);
  const element = screen.getByTestId('simple-component');
  expect(element).toBeInTheDocument();
  expect(element.textContent).toBe('Hello, world!');
});
