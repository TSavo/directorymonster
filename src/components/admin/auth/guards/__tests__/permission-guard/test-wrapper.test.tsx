import React from 'react';
import { render } from '@testing-library/react';
import { TestWrapper } from './test-wrapper';

describe('Permission Guard - TestWrapper', () => {
  it('should render children correctly', () => {
    const testId = 'test-content';
    const testContent = 'Test Content';
    
    const { getByTestId } = render(
      <TestWrapper>
        <div data-testid={testId}>{testContent}</div>
      </TestWrapper>
    );
    
    const element = getByTestId(testId);
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe(testContent);
  });
});
