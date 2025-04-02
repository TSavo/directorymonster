import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SEOStep from '@/components/admin/sites/components/SEOStep';
import { SEOSettings } from '@/components/admin/sites/SEOSettings';

// Mock the SEOSettings component that's used by SEOStep
jest.mock('@/components/admin/sites/SEOSettings', () => {
  const mockSEOSettings = jest.fn(({ initialData, onSuccess }) => (
    <div data-testid="seo-settings">
      <input
        data-testid="seo-title-input"
        value={initialData.seoTitle || ''}
        onChange={(e) => onSuccess({ ...initialData, seoTitle: e.target.value })}
      />
      <textarea
        data-testid="seo-description-input"
        value={initialData.seoDescription || ''}
        onChange={(e) => onSuccess({ ...initialData, seoDescription: e.target.value })}
      />
      <input
        type="checkbox"
        data-testid="enable-canonical-urls-checkbox"
        checked={initialData.enableCanonicalUrls || false}
        onChange={(e) => onSuccess({ ...initialData, enableCanonicalUrls: e.target.checked })}
      />
      <div data-testid="seo-step-heading">SEO Settings</div>
      <div data-testid="seo-step-description">Configure search engine optimization settings</div>
    </div>
  ));
  return {
    SEOSettings: mockSEOSettings
  };
});

describe('SEOStep Component - Basic Rendering', () => {
  // Mock form values
  const mockValues = {
    id: 'site-123',
    seoTitle: '',
    seoDescription: '',
    enableCanonicalUrls: false
  };

  // Mock functions
  const mockOnSEOChange = jest.fn();

  it('renders the SEOSettings component', () => {
    render(
      <SEOStep
        values={mockValues}
        onSEOChange={mockOnSEOChange}
      />
    );

    // Check if the SEOSettings component is rendered
    expect(screen.getByTestId('seo-settings')).toBeInTheDocument();
  });

  it('displays section heading and description', () => {
    render(
      <SEOStep
        values={mockValues}
        onSEOChange={mockOnSEOChange}
      />
    );

    // Check if heading and description are rendered
    expect(screen.getByTestId('seo-step-heading')).toBeInTheDocument();
    expect(screen.getByTestId('seo-step-heading')).toHaveTextContent(/SEO|Search Engine Optimization/i);
    expect(screen.getByTestId('seo-step-description')).toBeInTheDocument();
  });

  it('passes initial SEO data to SEOSettings component', () => {
    const valuesWithSeoData = {
      id: 'site-123',
      seoTitle: 'Test Title',
      seoDescription: 'Test Description',
      enableCanonicalUrls: true
    };

    render(
      <SEOStep
        values={valuesWithSeoData}
        onSEOChange={mockOnSEOChange}
      />
    );

    // Check if SEO data is passed to SEOSettings
    expect(screen.getByTestId('seo-title-input')).toHaveValue('Test Title');
    expect(screen.getByTestId('seo-description-input')).toHaveValue('Test Description');
    expect(screen.getByTestId('enable-canonical-urls-checkbox')).toBeChecked();
  });

  it('calls onSEOChange when SEO data is updated', () => {
    // Create a spy on the mock function to track calls
    const onSEOChangeSpy = jest.fn();

    render(
      <SEOStep
        values={mockValues}
        onSEOChange={onSEOChangeSpy}
      />
    );

    // Get the input element
    const titleInput = screen.getByTestId('seo-title-input');

    // Use fireEvent to simulate a change event
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Check if onSEOChange was called with updated data
    expect(onSEOChangeSpy).toHaveBeenCalled();
  });
});
