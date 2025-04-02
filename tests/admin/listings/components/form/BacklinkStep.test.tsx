import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BacklinkStep } from '@/components/admin/listings/components/form/BacklinkStep';
import { ListingFormData, ListingStatus } from '@/components/admin/listings/types';

// Mock the TextInput component used in BacklinkStep
jest.mock('@/components/admin/listings/components/form/TextInput', () => ({
  TextInput: ({ id, label, value, onChange, error, disabled, required, 'data-testid': dataTestId }) => (
    <div>
      <label htmlFor={id}>{label}{required && ' *'}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        data-testid={dataTestId}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  )
}));

describe('BacklinkStep Component', () => {
  // Default form data
  const defaultFormData: ListingFormData = {
    title: 'Test Listing',
    description: 'Test description',
    status: ListingStatus.DRAFT,
    categoryIds: ['cat1'],
    media: [],
    backlinkInfo: {
      url: 'https://example.com',
      anchorText: 'Visit our website'
    }
  };
  
  // Default props
  const defaultProps = {
    formData: defaultFormData,
    errors: {},
    updateNestedField: jest.fn(),
    isSubmitting: false
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the component with backlink fields', () => {
    render(<BacklinkStep {...defaultProps} />);
    
    // Check if the component is rendered
    expect(screen.getByTestId('listing-form-backlink')).toBeInTheDocument();
    
    // Check if heading and description are rendered
    expect(screen.getByText('Backlink Information')).toBeInTheDocument();
    expect(screen.getByText(/Provide a backlink to your website/)).toBeInTheDocument();
    
    // Check if URL and anchor text fields are rendered
    expect(screen.getByTestId('backlink-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('backlink-anchor-text-input')).toBeInTheDocument();
  });
  
  it('displays existing backlink values', () => {
    render(<BacklinkStep {...defaultProps} />);
    
    // Check if URL and anchor text fields have correct values
    expect(screen.getByTestId('backlink-url-input')).toHaveValue('https://example.com');
    expect(screen.getByTestId('backlink-anchor-text-input')).toHaveValue('Visit our website');
  });
  
  it('initializes with empty values when backlinkInfo is not provided', () => {
    const formDataWithoutBacklink = {
      ...defaultFormData,
      backlinkInfo: undefined
    };
    
    render(
      <BacklinkStep
        {...defaultProps}
        formData={formDataWithoutBacklink}
      />
    );
    
    // Check if URL and anchor text fields have empty values
    expect(screen.getByTestId('backlink-url-input')).toHaveValue('');
    expect(screen.getByTestId('backlink-anchor-text-input')).toHaveValue('');
  });
  
  it('calls updateNestedField when URL changes', () => {
    render(<BacklinkStep {...defaultProps} />);
    
    // Change URL
    const urlInput = screen.getByTestId('backlink-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://newexample.com' } });
    
    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('backlinkInfo', 'url', 'https://newexample.com');
  });
  
  it('calls updateNestedField when anchor text changes', () => {
    render(<BacklinkStep {...defaultProps} />);
    
    // Change anchor text
    const anchorTextInput = screen.getByTestId('backlink-anchor-text-input');
    fireEvent.change(anchorTextInput, { target: { value: 'Click here' } });
    
    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('backlinkInfo', 'anchorText', 'Click here');
  });
  
  it('displays validation errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        backlinkInfo: {
          url: 'Valid URL is required'
        }
      }
    };
    
    render(<BacklinkStep {...propsWithErrors} />);
    
    // Check if error message is displayed
    expect(screen.getByText('Valid URL is required')).toBeInTheDocument();
  });
  
  it('disables inputs when isSubmitting is true', () => {
    const submittingProps = {
      ...defaultProps,
      isSubmitting: true
    };
    
    render(<BacklinkStep {...submittingProps} />);
    
    // Check if inputs are disabled
    expect(screen.getByTestId('backlink-url-input')).toBeDisabled();
    expect(screen.getByTestId('backlink-anchor-text-input')).toBeDisabled();
  });
  
  it('marks URL field as required', () => {
    render(<BacklinkStep {...defaultProps} />);
    
    // Check if URL field is marked as required
    const urlLabel = screen.getByLabelText(/Backlink URL \*/);
    expect(urlLabel).toBeInTheDocument();
  });
  
  it('does not mark anchor text field as required', () => {
    render(<BacklinkStep {...defaultProps} />);
    
    // Check if anchor text field is not marked as required
    const anchorTextLabel = screen.getByLabelText(/Anchor Text/);
    expect(anchorTextLabel).toBeInTheDocument();
    expect(anchorTextLabel).not.toHaveTextContent('*');
  });
  
  it('handles empty anchor text correctly', () => {
    const formDataWithEmptyAnchorText = {
      ...defaultFormData,
      backlinkInfo: {
        url: 'https://example.com',
        anchorText: ''
      }
    };
    
    render(
      <BacklinkStep
        {...defaultProps}
        formData={formDataWithEmptyAnchorText}
      />
    );
    
    // Check if anchor text field has empty value
    expect(screen.getByTestId('backlink-anchor-text-input')).toHaveValue('');
    
    // Change anchor text
    const anchorTextInput = screen.getByTestId('backlink-anchor-text-input');
    fireEvent.change(anchorTextInput, { target: { value: 'New anchor text' } });
    
    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('backlinkInfo', 'anchorText', 'New anchor text');
  });
  
  it('marks fields with errors as invalid for accessibility', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        backlinkInfo: {
          url: 'Valid URL is required'
        }
      }
    };
    
    render(<BacklinkStep {...propsWithErrors} />);
    
    // Check if URL field is marked as invalid
    expect(screen.getByTestId('backlink-url-input')).toHaveAttribute('aria-invalid', 'true');
    
    // Check if anchor text field is not marked as invalid
    expect(screen.getByTestId('backlink-anchor-text-input')).toHaveAttribute('aria-invalid', 'false');
  });
});
