import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';
import { SiteFormPreview } from '@/components/admin/sites/components/SiteFormPreviewNew';

// Wrap component with context provider for testing
const renderWithContext = (initialData = {}) => {
  return render(
    <SiteFormProvider initialData={initialData}>
      <SiteFormPreview />
    </SiteFormProvider>
  );
};

describe('SiteFormPreview with Context', () => {
  it('renders the preview heading', () => {
    renderWithContext();
    
    // Check for heading
    expect(screen.getByTestId('previewStep-heading')).toBeInTheDocument();
  });
  
  it('displays site information in the preview', () => {
    const initialData = {
      name: 'Test Site',
      slug: 'test-site',
      description: 'This is a test site',
      domains: ['example.com', 'test.com'],
      theme: 'dark',
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description'
    };
    
    renderWithContext(initialData);
    
    // Check that site information is displayed
    expect(screen.getByTestId('preview-name')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('preview-slug')).toHaveTextContent('test-site');
    expect(screen.getByTestId('preview-description')).toHaveTextContent('This is a test site');
    expect(screen.getByTestId('preview-domains')).toHaveTextContent('example.com');
    expect(screen.getByTestId('preview-domains')).toHaveTextContent('test.com');
    expect(screen.getByTestId('preview-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('preview-seo')).toHaveTextContent('Test SEO Title');
    expect(screen.getByTestId('preview-seo')).toHaveTextContent('Test SEO Description');
  });
  
  it('displays a message when no domains are added', () => {
    const initialData = {
      name: 'Test Site',
      slug: 'test-site',
      domains: []
    };
    
    renderWithContext(initialData);
    
    // Check for no domains message
    expect(screen.getByTestId('preview-domains')).toHaveTextContent('No domains added');
  });
});
