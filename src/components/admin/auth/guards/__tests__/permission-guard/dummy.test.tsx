import React from 'react';
import { render } from '@testing-library/react';
import { TestWrapper } from './test-wrapper';

// This is a dummy test to ensure the test suite runs
describe('Permission Guard - Dummy Test', () => {
  it('should render the test wrapper', () => {
    const { container } = render(
      <TestWrapper>
        <div data-testid="test-content">Test Content</div>
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
  });
});
