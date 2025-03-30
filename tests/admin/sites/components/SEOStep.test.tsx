import React from 'react';
import { render, screen } from '@testing-library/react';
import { SEOStep } from '@/components/admin/sites/components/SEOStep';

// Mock the SEOSettings component that's used by SEOStep
jest.mock('@/components/admin/sites/SEOSettings', () => ({
  SEOSettings: ({ seoData, onSeoChange, errors }) => (
    <div data-testid="seo-settings">
      <input 
        data-testid="meta-title-input" 
        value={seoData.metaTitle || ''} 
        onChange={(e) => onSeoChange({ ...seoData, metaTitle: e.target.value })}
      />
      <textarea 
        data-testid="meta-description-input" 
        value={seoData.metaDescription || ''} 
        onChange={(e) => onSeoChange({ ...seoData, metaDescription: e.target.value })}
      />
      <input 
        type="checkbox" 
        data-testid="noindex-checkbox" 
        checked={seoData.noindex || false} 
        onChange={(e) => onSeoChange({ ...seoData, noindex: e.target.checked })}
      />
      {errors?.metaTitle && <div data-testid="meta-title-error">{errors.metaTitle}</div>}
      {errors?.metaDescription && <div data-testid="meta-description-error">{errors.metaDescription}</div>}
    </div>
  )
}));

describe('SEOStep Component - Basic Rendering', () => {
  // Mock form values
  const mockValues = {
    seo: {
      metaTitle: '',
      metaDescription: '',
      noindex: false
    }
  };
  
  // Mock functions
  const mockOnChange = jest.fn();
  const mockErrors = {};
  
  it('renders the SEOSettings component', () => {
    render(
      <SEOStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if the SEOSettings component is rendered
    expect(screen.getByTestId('seo-settings')).toBeInTheDocument();
  });

  it('displays section heading and description', () => {
    render(
      <SEOStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if heading and description are rendered
    expect(screen.getByTestId('seo-step-heading')).toBeInTheDocument();
    expect(screen.getByTestId('seo-step-heading')).toHaveTextContent(/SEO|Search Engine Optimization/i);
    expect(screen.getByTestId('seo-step-description')).toBeInTheDocument();
  });

  it('passes initial SEO data to SEOSettings component', () => {
    const valuesWithSeoData = {
      seo: {
        metaTitle: 'Test Title',
        metaDescription: 'Test Description',
        noindex: true
      }
    };
    
    render(
      <SEOStep 
        values={valuesWithSeoData}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if SEO data is passed to SEOSettings
    expect(screen.getByTestId('meta-title-input')).toHaveValue('Test Title');
    expect(screen.getByTestId('meta-description-input')).toHaveValue('Test Description');
    expect(screen.getByTestId('noindex-checkbox')).toBeChecked();
  });

  it('passes errors to SEOSettings when provided', () => {
    const mockErrorsWithSeo = {
      seo: {
        metaTitle: 'Meta title is required',
        metaDescription: 'Meta description is too long'
      }
    };
    
    render(
      <SEOStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrorsWithSeo}
      />
    );
    
    // Check if errors are passed to SEOSettings
    expect(screen.getByTestId('meta-title-error')).toHaveTextContent('Meta title is required');
    expect(screen.getByTestId('meta-description-error')).toHaveTextContent('Meta description is too long');
  });
});
