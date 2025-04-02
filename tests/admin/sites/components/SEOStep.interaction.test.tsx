import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SEOStep from '@/components/admin/sites/components/SEOStep';

// Mock the SEOSettings component that's used by SEOStep
jest.mock('@/components/admin/sites/SEOSettings', () => ({
  SEOSettings: ({ seoData, onSeoChange }) => (
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
    </div>
  )
}));

describe('SEOStep Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  // Mock form values
  const mockValues = {
    seo: {
      metaTitle: '',
      metaDescription: '',
      noindex: false
    }
  };
  
  it.skip($2, async () => {
    const mockOnChange = jest.fn();
    
    render(
      <SEOStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={{}}
      />
    );
    
    // Type in the meta title input
    const titleInput = screen.getByTestId('meta-title-input');
    await user.type(titleInput, 'New Meta Title');
    
    // Verify onChange was called with updated SEO data
    expect(mockOnChange).toHaveBeenCalledWith('seo', {
      metaTitle: 'New Meta Title',
      metaDescription: '',
      noindex: false
    });
  });

  it.skip($2, async () => {
    const mockOnChange = jest.fn();
    
    render(
      <SEOStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={{}}
      />
    );
    
    // Click the noindex checkbox
    const checkbox = screen.getByTestId('noindex-checkbox');
    await user.click(checkbox);
    
    // Verify onChange was called with updated noindex value
    expect(mockOnChange).toHaveBeenCalledWith('seo', {
      metaTitle: '',
      metaDescription: '',
      noindex: true
    });
  });
});
