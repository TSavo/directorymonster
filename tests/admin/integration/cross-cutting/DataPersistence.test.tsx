import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingForm } from '../../../../src/components/admin/listings/ListingForm';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/listings/components/form/useListingForm', () => ({
  useListingForm: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock next router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock hooks implementation
import { useListingForm } from '../../../../src/components/admin/listings/components/form/useListingForm';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Data Persistence Across Page Refreshes', () => {
  let store;
  
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/admin/listings/new',
      query: {},
      asPath: '/admin/listings/new',
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: [],
        loading: false,
        error: null,
      },
    });
  });

  it('should save form data to localStorage when user types', async () => {
    // Setup form hooks with functionality to save to localStorage
    const updateFormField = jest.fn((field, value) => {
      const draftData = JSON.parse(localStorageMock.getItem('listingFormDraft') || '{}');
      draftData[field] = value;
      localStorageMock.setItem('listingFormDraft', JSON.stringify(draftData));
    });
    
    const saveFormDraft = jest.fn(() => {
      const formData = {
        title: 'Test Listing',
        description: 'Test description',
      };
      localStorageMock.setItem('listingFormDraft', JSON.stringify(formData));
    });
    
    (useListingForm as jest.Mock).mockReturnValue({
      formData: {
        title: '',
        description: '',
      },
      updateFormField,
      saveFormDraft,
      loadFormDraft: jest.fn(),
      errors: {},
    });
    
    render(
      <Provider store={store}>
        <ListingForm />
      </Provider>
    );
    
    // Type in the title field
    fireEvent.change(screen.getByTestId('listing-title-input'), { 
      target: { value: 'Test Listing' } 
    });
    
    // Verify updateFormField was called
    expect(updateFormField).toHaveBeenCalledWith('title', 'Test Listing');
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalled();
    expect(JSON.parse(localStorageMock.getItem('listingFormDraft'))).toHaveProperty('title', 'Test Listing');
    
    // Type in the description field
    fireEvent.change(screen.getByTestId('listing-description-input'), { 
      target: { value: 'Test description' } 
    });
    
    // Verify localStorage was updated again
    expect(JSON.parse(localStorageMock.getItem('listingFormDraft'))).toHaveProperty('description', 'Test description');
  });

  it('should load saved form data from localStorage on page load', async () => {
    // Setup localStorage with saved form data
    const savedFormData = {
      title: 'Saved Listing',
      description: 'Saved description',
    };
    localStorageMock.setItem('listingFormDraft', JSON.stringify(savedFormData));
    
    // Mock form hook to load from localStorage
    const loadFormDraft = jest.fn(() => {
      return JSON.parse(localStorageMock.getItem('listingFormDraft'));
    });
    
    (useListingForm as jest.Mock).mockReturnValue({
      formData: savedFormData, // Simulate loaded form data
      updateFormField: jest.fn(),
      saveFormDraft: jest.fn(),
      loadFormDraft,
      errors: {},
    });
    
    render(
      <Provider store={store}>
        <ListingForm />
      </Provider>
    );
    
    // Verify loadFormDraft was called
    expect(loadFormDraft).toHaveBeenCalled();
    
    // Verify the form fields show the saved data
    expect(screen.getByTestId('listing-title-input')).toHaveValue('Saved Listing');
    expect(screen.getByTestId('listing-description-input')).toHaveValue('Saved description');
  });
});
