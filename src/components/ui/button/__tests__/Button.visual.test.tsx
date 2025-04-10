import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Visual Regression', () => {
  it('renders all button variants', () => {
    const { container } = render(
      <div>
        <Button variant="default" data-testid="default-button">Default</Button>
        <Button variant="destructive" data-testid="destructive-button">Destructive</Button>
        <Button variant="outline" data-testid="outline-button">Outline</Button>
        <Button variant="secondary" data-testid="secondary-button">Secondary</Button>
        <Button variant="ghost" data-testid="ghost-button">Ghost</Button>
        <Button variant="link" data-testid="link-button">Link</Button>
      </div>
    );
    
    // In a real visual regression test, we would use a tool like Percy or Chromatic
    // to take a screenshot of the rendered component and compare it to a baseline
    expect(container).toMatchSnapshot();
  });

  it('renders all button sizes', () => {
    const { container } = render(
      <div>
        <Button size="default" data-testid="default-size">Default</Button>
        <Button size="sm" data-testid="sm-size">Small</Button>
        <Button size="lg" data-testid="lg-size">Large</Button>
        <Button size="icon" data-testid="icon-size">Icon</Button>
      </div>
    );
    
    expect(container).toMatchSnapshot();
  });

  it('renders loading state', () => {
    const { container } = render(
      <div>
        <Button isLoading data-testid="loading-button">Loading</Button>
        <Button isLoading loadingText="Please wait..." data-testid="loading-text-button">Submit</Button>
      </div>
    );
    
    expect(container).toMatchSnapshot();
  });

  it('renders with icons', () => {
    const { container } = render(
      <div>
        <Button 
          leftIcon={<span>🔍</span>} 
          data-testid="left-icon-button"
        >
          Search
        </Button>
        <Button 
          rightIcon={<span>→</span>} 
          data-testid="right-icon-button"
        >
          Next
        </Button>
        <Button 
          leftIcon={<span>🔍</span>} 
          rightIcon={<span>→</span>} 
          data-testid="both-icons-button"
        >
          Search and Next
        </Button>
      </div>
    );
    
    expect(container).toMatchSnapshot();
  });
});
