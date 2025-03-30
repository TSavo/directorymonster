"use client";

import { 
  ListingFormData, 
  ListingFormErrors,
  ListingStatus,
  PriceType
} from '../../types';

/**
 * Validates a string field with a minimum and maximum length
 * @param value - The string value to validate
 * @param minLength - Minimum length (default: 3)
 * @param maxLength - Maximum length (default: 255)
 * @param fieldName - Name of the field for error message
 * @returns Error message or undefined if valid
 */
export const validateString = (
  value: string | undefined, 
  minLength = 3, 
  maxLength = 255, 
  fieldName = 'Field'
): string | undefined => {
  if (!value) {
    return `${fieldName} is required`;
  }
  
  if (value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  
  if (value.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  
  return undefined;
};

/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @param isRequired - Whether the URL is required
 * @returns Error message or undefined if valid
 */
export const validateUrl = (url: string | undefined, isRequired = true): string | undefined => {
  if (!url) {
    return isRequired ? 'URL is required' : undefined;
  }
  
  try {
    new URL(url);
    return undefined;
  } catch {
    return 'Please enter a valid URL (including http:// or https://)';
  }
};

/**
 * Validates an email address
 * @param email - The email to validate
 * @param isRequired - Whether the email is required
 * @returns Error message or undefined if valid
 */
export const validateEmail = (email: string | undefined, isRequired = true): string | undefined => {
  if (!email) {
    return isRequired ? 'Email is required' : undefined;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return undefined;
};

/**
 * Validates a phone number
 * @param phone - The phone number to validate
 * @param isRequired - Whether the phone is required
 * @returns Error message or undefined if valid
 */
export const validatePhone = (phone: string | undefined, isRequired = true): string | undefined => {
  if (!phone) {
    return isRequired ? 'Phone number is required' : undefined;
  }
  
  // Simple validation - more complex country-specific validation could be implemented
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return undefined;
};

/**
 * Validates a price amount
 * @param priceType - The type of price
 * @param amount - The amount to validate
 * @returns Error message or undefined if valid
 */
export const validatePrice = (
  priceType: PriceType | undefined, 
  amount: number | undefined
): string | undefined => {
  if (!priceType) {
    return 'Price type is required';
  }
  
  if (priceType === PriceType.FREE || priceType === PriceType.CONTACT) {
    return undefined;
  }
  
  if (amount === undefined) {
    return 'Price amount is required';
  }
  
  if (isNaN(amount) || amount < 0) {
    return 'Price must be a valid number greater than or equal to 0';
  }
  
  return undefined;
};

/**
 * Validates a category selection
 * @param categoryIds - Array of selected category IDs
 * @returns Error message or undefined if valid
 */
export const validateCategories = (categoryIds: string[] | undefined): string | undefined => {
  if (!categoryIds || categoryIds.length === 0) {
    return 'At least one category must be selected';
  }
  
  return undefined;
};

/**
 * Validates media items
 * @param media - Array of media items
 * @returns Error message or undefined if valid
 */
export const validateMedia = (media: any[] | undefined): string | undefined => {
  if (!media || media.length === 0) {
    return 'At least one image is required';
  }
  
  return undefined;
};

/**
 * Validates a date is in the future
 * @param date - Date string to validate
 * @param isRequired - Whether the date is required
 * @returns Error message or undefined if valid
 */
export const validateFutureDate = (
  date: string | undefined, 
  isRequired = false
): string | undefined => {
  if (!date) {
    return isRequired ? 'Date is required' : undefined;
  }
  
  const selectedDate = new Date(date);
  const now = new Date();
  
  if (isNaN(selectedDate.getTime())) {
    return 'Please enter a valid date';
  }
  
  if (selectedDate <= now) {
    return 'Date must be in the future';
  }
  
  return undefined;
};

/**
 * Validates an entire listing form data object
 * @param formData - The form data to validate
 * @returns Object with validation errors for each field
 */
export const validateListingForm = (formData: ListingFormData): ListingFormErrors => {
  const errors: ListingFormErrors = {};
  
  // Validate basic info
  errors.title = validateString(formData.title, 5, 100, 'Title');
  errors.description = validateString(formData.description, 20, 5000, 'Description');
  errors.status = formData.status ? undefined : 'Status is required';
  
  // Validate categories
  errors.categoryIds = validateCategories(formData.categoryIds);
  
  // Validate media
  errors.media = validateMedia(formData.media);
  
  // Validate price if present
  if (formData.price) {
    errors.price = {
      priceType: formData.price.priceType ? undefined : 'Price type is required',
      amount: validatePrice(formData.price.priceType, formData.price.amount)
    };
  }
  
  // Validate contact info if present
  if (formData.contactInfo) {
    errors.contactInfo = {
      email: validateEmail(formData.contactInfo.email, false),
      phone: validatePhone(formData.contactInfo.phone, false),
      website: validateUrl(formData.contactInfo.website, false)
    };
  }
  
  // Validate backlink info if present
  if (formData.backlinkInfo) {
    errors.backlinkInfo = {
      url: validateUrl(formData.backlinkInfo.url, true)
    };
  }
  
  // Validate featured date if featured is true
  if (formData.featured && !formData.featuredUntil) {
    errors.featuredUntil = 'Featured end date is required for featured listings';
  } else if (formData.featured && formData.featuredUntil) {
    errors.featuredUntil = validateFutureDate(formData.featuredUntil);
  }
  
  // Filter out undefined errors and empty sub-objects
  Object.keys(errors).forEach(key => {
    const error = errors[key];
    if (error === undefined) {
      delete errors[key];
    } else if (typeof error === 'object' && error !== null) {
      const subErrors = error as Record<string, string | undefined>;
      const hasErrors = Object.values(subErrors).some(val => val !== undefined);
      if (!hasErrors) {
        delete errors[key];
      }
    }
  });
  
  return errors;
};

/**
 * Validates only specific steps of the form
 * @param formData - The form data to validate
 * @param step - The current step to validate
 * @returns Object with validation errors for the current step
 */
export const validateStep = (formData: ListingFormData, step: number): ListingFormErrors => {
  const allErrors = validateListingForm(formData);
  const stepErrors: ListingFormErrors = {};
  
  switch (step) {
    case 1: // Basic info step
      if (allErrors.title) stepErrors.title = allErrors.title;
      if (allErrors.description) stepErrors.description = allErrors.description;
      if (allErrors.status) stepErrors.status = allErrors.status;
      break;
      
    case 2: // Category selection step
      if (allErrors.categoryIds) stepErrors.categoryIds = allErrors.categoryIds;
      break;
      
    case 3: // Media upload step
      if (allErrors.media) stepErrors.media = allErrors.media;
      break;
      
    case 4: // Pricing step
      if (allErrors.price) stepErrors.price = allErrors.price;
      break;
      
    case 5: // Backlink step
      if (allErrors.backlinkInfo) stepErrors.backlinkInfo = allErrors.backlinkInfo;
      break;
      
    default:
      return {};
  }
  
  return stepErrors;
};

/**
 * Checks if a specific step of the form is valid
 * @param formData - The form data to validate
 * @param step - The step to check
 * @returns True if the step is valid, false otherwise
 */
export const isStepValid = (formData: ListingFormData, step: number): boolean => {
  const stepErrors = validateStep(formData, step);
  return Object.keys(stepErrors).length === 0;
};

/**
 * Checks if the entire form is valid
 * @param formData - The form data to validate
 * @returns True if the entire form is valid, false otherwise
 */
export const isFormValid = (formData: ListingFormData): boolean => {
  const errors = validateListingForm(formData);
  return Object.keys(errors).length === 0;
};
