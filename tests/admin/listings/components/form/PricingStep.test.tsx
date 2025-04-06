import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingStep from '@/components/admin/listings/components/form/PricingStep';
import { ListingFormData } from '@/components/admin/listings/types';
import { PriceType, ListingStatus } from '@/types/listing';

// Mock the form components used in PricingStep
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

jest.mock('@/components/admin/listings/components/form/SelectField', () => ({
  SelectField: ({ id, label, value, options, onChange, error, disabled, required, 'data-testid': dataTestId }) => (
    <div>
      <label htmlFor={id}>{label}{required && ' *'}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        data-testid={dataTestId}
        aria-invalid={error ? 'true' : 'false'}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  )
}));

describe('PricingStep Component', () => {
  // Default form data
  const defaultFormData: ListingFormData = {
    title: 'Test Listing',
    description: 'Test description',
    status: ListingStatus.DRAFT,
    categoryIds: ['cat1'],
    media: [],
    price: {
      priceType: PriceType.FIXED,
      amount: 99.99,
      currency: 'USD'
    }
  };

  // Default props
  const defaultProps = {
    formData: defaultFormData,
    errors: {},
    updateField: jest.fn(),
    updateNestedField: jest.fn(),
    isSubmitting: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with all price type options', () => {
    render(<PricingStep {...defaultProps} />);

    // Check if the component is rendered
    expect(screen.getByTestId('listing-form-pricing')).toBeInTheDocument();

    // Check if price type select is rendered with all options
    const priceTypeSelect = screen.getByTestId('price-type-select');
    expect(priceTypeSelect).toBeInTheDocument();

    // Check if all price type options are available
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Fixed Price')).toBeInTheDocument();
    expect(screen.getByText('Starting At')).toBeInTheDocument();
    expect(screen.getByText('Variable Price')).toBeInTheDocument();
    expect(screen.getByText('Contact for Price')).toBeInTheDocument();
  });

  it('shows price amount and currency fields for fixed price type', () => {
    render(<PricingStep {...defaultProps} />);

    // Price amount and currency fields should be visible
    expect(screen.getByTestId('price-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('price-currency-select')).toBeInTheDocument();

    // Price description field should not be visible
    expect(screen.queryByTestId('price-description-input')).not.toBeInTheDocument();
  });

  it('hides price amount and currency fields for free price type', () => {
    const formDataWithFreePrice = {
      ...defaultFormData,
      price: {
        priceType: PriceType.FREE
      }
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithFreePrice}
      />
    );

    // Price amount and currency fields should not be visible
    expect(screen.queryByTestId('price-amount-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('price-currency-select')).not.toBeInTheDocument();
  });

  it('hides price amount and currency fields for contact price type', () => {
    const formDataWithContactPrice = {
      ...defaultFormData,
      price: {
        priceType: PriceType.CONTACT
      }
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithContactPrice}
      />
    );

    // Price amount and currency fields should not be visible
    expect(screen.queryByTestId('price-amount-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('price-currency-select')).not.toBeInTheDocument();
  });

  it('shows price description field for variable price type', () => {
    const formDataWithVariablePrice = {
      ...defaultFormData,
      price: {
        priceType: PriceType.VARIABLE,
        amount: 99.99,
        currency: 'USD',
        description: 'Varies by size and color'
      }
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithVariablePrice}
      />
    );

    // Price amount, currency, and description fields should be visible
    expect(screen.getByTestId('price-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('price-currency-select')).toBeInTheDocument();
    expect(screen.getByTestId('price-description-input')).toBeInTheDocument();
  });

  it('calls updateNestedField when price type changes', () => {
    render(<PricingStep {...defaultProps} />);

    // Change price type to variable
    const priceTypeSelect = screen.getByTestId('price-type-select');
    fireEvent.change(priceTypeSelect, { target: { value: PriceType.VARIABLE } });

    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('price', 'priceType', PriceType.VARIABLE);
  });

  it('calls updateNestedField when price amount changes', () => {
    render(<PricingStep {...defaultProps} />);

    // Change price amount
    const priceAmountInput = screen.getByTestId('price-amount-input');
    fireEvent.change(priceAmountInput, { target: { value: '199.99' } });

    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('price', 'amount', 199.99);
  });

  it('calls updateNestedField with undefined when price amount is not a number', () => {
    render(<PricingStep {...defaultProps} />);

    // Change price amount to non-numeric value
    const priceAmountInput = screen.getByTestId('price-amount-input');
    fireEvent.change(priceAmountInput, { target: { value: 'not-a-number' } });

    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('price', 'amount', undefined);
  });

  it('calls updateNestedField when currency changes', () => {
    render(<PricingStep {...defaultProps} />);

    // Change currency
    const currencySelect = screen.getByTestId('price-currency-select');
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });

    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('price', 'currency', 'EUR');
  });

  it('shows on sale checkbox for price types that show amount', () => {
    render(<PricingStep {...defaultProps} />);

    // On sale checkbox should be visible
    expect(screen.getByTestId('on-sale-checkbox')).toBeInTheDocument();
  });

  it('hides on sale checkbox for free price type', () => {
    const formDataWithFreePrice = {
      ...defaultFormData,
      price: {
        priceType: PriceType.FREE
      }
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithFreePrice}
      />
    );

    // On sale checkbox should be disabled
    const onSaleCheckbox = screen.getByTestId('on-sale-checkbox');
    expect(onSaleCheckbox).toBeDisabled();
  });

  it('shows sale price input when on sale is checked', () => {
    const formDataWithSale = {
      ...defaultFormData,
      price: {
        priceType: PriceType.FIXED,
        amount: 99.99,
        currency: 'USD',
        onSale: true,
        salePrice: 79.99
      }
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithSale}
      />
    );

    // Sale price input should be visible
    expect(screen.getByTestId('sale-price-input')).toBeInTheDocument();
  });

  it('calls updateNestedField when on sale checkbox is toggled', () => {
    render(<PricingStep {...defaultProps} />);

    // Toggle on sale checkbox
    const onSaleCheckbox = screen.getByTestId('on-sale-checkbox');
    fireEvent.click(onSaleCheckbox);

    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('price', 'onSale', true);
  });

  it('calls updateNestedField when sale price changes', () => {
    const formDataWithSale = {
      ...defaultFormData,
      price: {
        priceType: PriceType.FIXED,
        amount: 99.99,
        currency: 'USD',
        onSale: true,
        salePrice: 79.99
      }
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithSale}
      />
    );

    // Change sale price
    const salePriceInput = screen.getByTestId('sale-price-input');
    fireEvent.change(salePriceInput, { target: { value: '69.99' } });

    // Check if updateNestedField was called with correct arguments
    expect(defaultProps.updateNestedField).toHaveBeenCalledWith('price', 'salePrice', 69.99);
  });

  it('displays validation errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        price: {
          amount: 'Price amount is required',
          currency: 'Currency is required'
        }
      }
    };

    render(<PricingStep {...propsWithErrors} />);

    // Check if error messages are displayed
    expect(screen.getByText('Price amount is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
  });

  it('disables all inputs when isSubmitting is true', () => {
    const submittingProps = {
      ...defaultProps,
      isSubmitting: true
    };

    render(<PricingStep {...submittingProps} />);

    // All inputs should be disabled
    expect(screen.getByTestId('price-type-select')).toBeDisabled();
    expect(screen.getByTestId('price-amount-input')).toBeDisabled();
    expect(screen.getByTestId('price-currency-select')).toBeDisabled();
    expect(screen.getByTestId('on-sale-checkbox')).toBeDisabled();
  });

  it('initializes with default price type when price is not provided', () => {
    const formDataWithoutPrice = {
      ...defaultFormData,
      price: undefined
    };

    render(
      <PricingStep
        {...defaultProps}
        formData={formDataWithoutPrice}
      />
    );

    // Price type should be set to FIXED by default
    const priceTypeSelect = screen.getByTestId('price-type-select');
    expect(priceTypeSelect).toHaveValue(PriceType.FIXED);
  });
});
