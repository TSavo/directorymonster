"use client";

import React from 'react';
import { ListingFormData } from '../../types';
import { PriceType } from '@/types/listing';
import { SelectField } from './SelectField';
import { TextInput } from './TextInput';

interface PricingStepProps {
  formData: ListingFormData;
  errors: Record<string, any>;
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  updateNestedField: <
    K extends keyof ListingFormData,
    NK extends keyof NonNullable<ListingFormData[K]>
  >(parentField: K, nestedField: NK, value: any) => void;
  isSubmitting: boolean;
}

export default function PricingStep({
  formData,
  errors,
  updateField,
  updateNestedField,
  isSubmitting
}: PricingStepProps) {
  // Price type options
  const priceTypeOptions = [
    { value: PriceType.FREE, label: 'Free' },
    { value: PriceType.FIXED, label: 'Fixed Price' },
    { value: PriceType.STARTING_AT, label: 'Starting At' },
    { value: PriceType.VARIABLE, label: 'Variable Price' },
    { value: PriceType.CONTACT, label: 'Contact for Price' }
  ];

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' },
    { value: 'JPY', label: 'JPY (¥)' }
  ];

  // Initialize price if not present
  const price = formData.price || { priceType: PriceType.FIXED };

  // Handle price type change
  const handlePriceTypeChange = (priceType: string) => {
    updateNestedField('price', 'priceType', priceType as PriceType);
  };

  // Handle price amount change
  const handlePriceAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount);
    updateNestedField('price', 'amount', isNaN(numAmount) ? undefined : numAmount);
  };

  // Get price errors
  const priceErrors = errors.price || {};

  // Check if price amount should be shown
  const showPriceAmount = price.priceType &&
    price.priceType !== PriceType.FREE &&
    price.priceType !== PriceType.CONTACT;

  return (
    <div className="space-y-4" data-testid="listing-form-pricing">
      <h3 className="text-lg font-medium text-gray-900">Pricing Information</h3>

      <SelectField
        id="price-type"
        label="Price Type"
        value={price.priceType || ''}
        options={priceTypeOptions}
        onChange={handlePriceTypeChange}
        error={priceErrors.priceType}
        disabled={isSubmitting}
        required
        data-testid="price-type-select"
      />

      {showPriceAmount && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            id="price-amount"
            label="Price Amount"
            value={price.amount !== undefined ? String(price.amount) : ''}
            onChange={handlePriceAmountChange}
            error={priceErrors.amount}
            disabled={isSubmitting}
            required
            placeholder="0.00"
            data-testid="price-amount-input"
          />

          <SelectField
            id="price-currency"
            label="Currency"
            value={price.currency || 'USD'}
            options={currencyOptions}
            onChange={(value) => updateNestedField('price', 'currency', value)}
            error={priceErrors.currency}
            disabled={isSubmitting}
            data-testid="price-currency-select"
          />
        </div>
      )}

      {price.priceType === PriceType.VARIABLE && (
        <TextInput
          id="price-description"
          label="Price Description"
          value={price.description || ''}
          onChange={(value) => updateNestedField('price', 'description', value)}
          error={priceErrors.description}
          disabled={isSubmitting}
          placeholder="E.g., 'Varies by size, color options'"
          data-testid="price-description-input"
        />
      )}

      <div className="mt-4">
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="on-sale"
              type="checkbox"
              checked={price.onSale || false}
              onChange={(e) => updateNestedField('price', 'onSale', e.target.checked)}
              disabled={isSubmitting || !showPriceAmount}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              data-testid="on-sale-checkbox"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="on-sale" className="font-medium text-gray-700">
              On Sale
            </label>
          </div>
        </div>
      </div>

      {price.onSale && showPriceAmount && (
        <div className="mt-2">
          <TextInput
            id="sale-price"
            label="Sale Price"
            value={price.salePrice !== undefined ? String(price.salePrice) : ''}
            onChange={(value) => {
              const numValue = parseFloat(value);
              updateNestedField('price', 'salePrice', isNaN(numValue) ? undefined : numValue);
            }}
            error={priceErrors.salePrice}
            disabled={isSubmitting}
            required
            placeholder="0.00"
            data-testid="sale-price-input"
          />
        </div>
      )}
    </div>
  );
}


