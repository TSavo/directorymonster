import {
  validateString,
  validateUrl,
  validateEmail,
  validatePhone,
  validatePrice,
  validateCategories,
  validateMedia,
  validateFutureDate,
  validateStep,
  validateListingForm,
  isStepValid,
  isFormValid
} from '@/components/admin/listings/components/form/listingFormValidation';
import { ListingFormData, ListingStatus, PriceType, MediaType } from '@/components/admin/listings/types';

describe('Listing Form Validation', () => {
  describe('validateString', () => {
    it('returns error for empty string', () => {
      expect(validateString('')).toBe('Field is required');
      expect(validateString(undefined)).toBe('Field is required');
    });

    it('returns error for string shorter than minimum length', () => {
      expect(validateString('ab', 3)).toBe('Field must be at least 3 characters');
    });

    it('returns error for string longer than maximum length', () => {
      expect(validateString('abcdef', 1, 5)).toBe('Field cannot exceed 5 characters');
    });

    it('returns undefined for valid string', () => {
      expect(validateString('valid string')).toBeUndefined();
    });

    it('uses custom field name in error messages', () => {
      expect(validateString('', 3, 255, 'Title')).toBe('Title is required');
      expect(validateString('ab', 3, 255, 'Title')).toBe('Title must be at least 3 characters');
    });
  });

  describe('validateUrl', () => {
    it('returns error for empty URL when required', () => {
      expect(validateUrl('', true)).toBe('URL is required');
      expect(validateUrl(undefined, true)).toBe('URL is required');
    });

    it('returns undefined for empty URL when not required', () => {
      expect(validateUrl('', false)).toBeUndefined();
      expect(validateUrl(undefined, false)).toBeUndefined();
    });

    it('returns error for invalid URL', () => {
      expect(validateUrl('not-a-url')).toBe('Please enter a valid URL (including http:// or https://)');
      expect(validateUrl('http://')).toBe('Please enter a valid URL (including http:// or https://)');
    });

    it('returns undefined for valid URL', () => {
      expect(validateUrl('https://example.com')).toBeUndefined();
      expect(validateUrl('http://subdomain.example.co.uk/path?query=1')).toBeUndefined();
    });
  });

  describe('validateEmail', () => {
    it('returns error for empty email when required', () => {
      expect(validateEmail('', true)).toBe('Email is required');
      expect(validateEmail(undefined, true)).toBe('Email is required');
    });

    it('returns undefined for empty email when not required', () => {
      expect(validateEmail('', false)).toBeUndefined();
      expect(validateEmail(undefined, false)).toBeUndefined();
    });

    it('returns error for invalid email', () => {
      expect(validateEmail('not-an-email')).toBe('Please enter a valid email address');
      expect(validateEmail('user@')).toBe('Please enter a valid email address');
    });

    it('returns undefined for valid email', () => {
      expect(validateEmail('user@example.com')).toBeUndefined();
      expect(validateEmail('user.name+tag@example.co.uk')).toBeUndefined();
    });
  });

  describe('validatePhone', () => {
    it('returns error for empty phone when required', () => {
      expect(validatePhone('', true)).toBe('Phone number is required');
      expect(validatePhone(undefined, true)).toBe('Phone number is required');
    });

    it('returns undefined for empty phone when not required', () => {
      expect(validatePhone('', false)).toBeUndefined();
      expect(validatePhone(undefined, false)).toBeUndefined();
    });

    it('returns error for invalid phone', () => {
      expect(validatePhone('not-a-phone')).toBe('Please enter a valid phone number');
      expect(validatePhone('123')).toBe('Please enter a valid phone number');
    });

    it('returns undefined for valid phone', () => {
      expect(validatePhone('1234567890')).toBeUndefined();
      expect(validatePhone('1234567890')).toBeUndefined();
      expect(validatePhone('1234567890')).toBeUndefined();
    });
  });

  describe('validatePrice', () => {
    it('returns error for missing price type', () => {
      expect(validatePrice(undefined, 100)).toBe('Price type is required');
    });

    it('returns undefined for FREE or CONTACT price types regardless of amount', () => {
      expect(validatePrice(PriceType.FREE, undefined)).toBeUndefined();
      expect(validatePrice(PriceType.CONTACT, undefined)).toBeUndefined();
    });

    it('returns error for missing amount with non-FREE price types', () => {
      expect(validatePrice(PriceType.FIXED, undefined)).toBe('Price amount is required');
      expect(validatePrice(PriceType.STARTING_AT, undefined)).toBe('Price amount is required');
      expect(validatePrice(PriceType.VARIABLE, undefined)).toBe('Price amount is required');
    });

    it('returns error for invalid amount', () => {
      expect(validatePrice(PriceType.FIXED, -10)).toBe('Price must be a valid number greater than or equal to 0');
    });

    it('returns undefined for valid price', () => {
      expect(validatePrice(PriceType.FIXED, 100)).toBeUndefined();
      expect(validatePrice(PriceType.STARTING_AT, 0)).toBeUndefined();
      expect(validatePrice(PriceType.VARIABLE, 99.99)).toBeUndefined();
    });
  });

  describe('validateCategories', () => {
    it('returns error for empty categories', () => {
      expect(validateCategories([])).toBe('At least one category must be selected');
      expect(validateCategories(undefined)).toBe('At least one category must be selected');
    });

    it('returns undefined for valid categories', () => {
      expect(validateCategories(['category1'])).toBeUndefined();
      expect(validateCategories(['category1', 'category2'])).toBeUndefined();
    });
  });

  describe('validateMedia', () => {
    it('returns error for empty media', () => {
      expect(validateMedia([])).toBe('At least one image is required');
      expect(validateMedia(undefined)).toBe('At least one image is required');
    });

    it('returns undefined for valid media', () => {
      expect(validateMedia([{ id: 'media1' }])).toBeUndefined();
      expect(validateMedia([{ id: 'media1' }, { id: 'media2' }])).toBeUndefined();
    });
  });

  describe('validateFutureDate', () => {
    it('returns error for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      expect(validateFutureDate(pastDate.toISOString())).toBe('Date must be in the future');
    });

    it('returns undefined for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      expect(validateFutureDate(futureDate.toISOString())).toBeUndefined();
    });
  });

  describe('validateStep', () => {
    const validFormData: ListingFormData = {
      title: 'Valid Title',
      description: 'This is a valid description that meets the minimum length requirement.',
      status: ListingStatus.DRAFT,
      categoryIds: ['category1'],
      media: [{ id: 'media1', url: 'test.jpg', type: MediaType.IMAGE, createdAt: '', updatedAt: '' }],
      price: {
        priceType: PriceType.FIXED,
        amount: 99.99,
        currency: 'USD'
      },
      backlinkInfo: {
        url: 'https://example.com',
        anchorText: 'Visit our website'
      }
    };

    it('validates step 1 (Basic Info)', () => {
      const invalidData = { ...validFormData, title: '', description: 'Too short' };
      const errors = validateStep(invalidData, 1);

      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(Object.keys(errors).length).toBe(2);

      const validErrors = validateStep(validFormData, 1);
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it('validates step 2 (Categories)', () => {
      const invalidData = { ...validFormData, categoryIds: [] };
      const errors = validateStep(invalidData, 2);

      expect(errors.categoryIds).toBeDefined();
      expect(Object.keys(errors).length).toBe(1);

      const validErrors = validateStep(validFormData, 2);
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it('validates step 3 (Media)', () => {
      const invalidData = { ...validFormData, media: [] };
      const errors = validateStep(invalidData, 3);

      expect(errors.media).toBeDefined();
      expect(Object.keys(errors).length).toBe(1);

      const validErrors = validateStep(validFormData, 3);
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it('validates step 4 (Pricing)', () => {
      const invalidData = {
        ...validFormData,
        price: {
          priceType: PriceType.FIXED,
          amount: undefined,
          currency: undefined
        }
      };
      const errors = validateStep(invalidData, 4);

      expect(errors.price).toBeDefined();
      expect(errors.price?.amount).toBeDefined();

      const validErrors = validateStep(validFormData, 4);
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it('validates step 5 (Backlink)', () => {
      const invalidData = {
        ...validFormData,
        backlinkInfo: {
          url: 'not-a-valid-url',
          anchorText: 'Visit our website'
        }
      };
      const errors = validateStep(invalidData, 5);

      expect(errors.backlinkInfo).toBeDefined();
      expect(errors.backlinkInfo?.url).toBeDefined();

      const validErrors = validateStep(validFormData, 5);
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it('returns empty object for unknown step', () => {
      const errors = validateStep(validFormData, 99);
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('validateListingForm', () => {
    const validFormData: ListingFormData = {
      title: 'Valid Title',
      description: 'This is a valid description that meets the minimum length requirement.',
      status: ListingStatus.DRAFT,
      categoryIds: ['category1'],
      media: [{ id: 'media1', url: 'test.jpg', type: MediaType.IMAGE, createdAt: '', updatedAt: '' }],
      price: {
        priceType: PriceType.FIXED,
        amount: 99.99,
        currency: 'USD'
      },
      backlinkInfo: {
        url: 'https://example.com',
        anchorText: 'Visit our website'
      }
    };

    it('validates the entire form data', () => {
      const invalidData: ListingFormData = {
        title: '',
        description: 'Too short',
        status: undefined,
        categoryIds: [],
        media: [],
        price: {
          priceType: PriceType.FIXED,
          amount: undefined,
          currency: undefined
        },
        backlinkInfo: {
          url: 'not-a-valid-url',
          anchorText: 'Visit our website'
        }
      };

      const errors = validateListingForm(invalidData);

      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.status).toBeDefined();
      expect(errors.categoryIds).toBeDefined();
      expect(errors.media).toBeDefined();
      expect(errors.price).toBeDefined();
      expect(errors.backlinkInfo).toBeDefined();

      const validErrors = validateListingForm(validFormData);
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it('validates featured listings with end date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const invalidData = {
        ...validFormData,
        featured: true,
        featuredUntil: pastDate.toISOString()
      };

      const errors = validateListingForm(invalidData);
      expect(errors.featuredUntil).toBeDefined();

      const missingDateData = {
        ...validFormData,
        featured: true,
        featuredUntil: undefined
      };

      const missingDateErrors = validateListingForm(missingDateData);
      expect(missingDateErrors.featuredUntil).toBeDefined();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const validFeaturedData = {
        ...validFormData,
        featured: true,
        featuredUntil: futureDate.toISOString()
      };

      const validFeaturedErrors = validateListingForm(validFeaturedData);
      expect(validFeaturedErrors.featuredUntil).toBeUndefined();
    });
  });

  describe('isStepValid', () => {
    const validFormData: ListingFormData = {
      title: 'Valid Title',
      description: 'This is a valid description that meets the minimum length requirement.',
      status: ListingStatus.DRAFT,
      categoryIds: ['category1'],
      media: [{ id: 'media1', url: 'test.jpg', type: MediaType.IMAGE, createdAt: '', updatedAt: '' }],
      price: {
        priceType: PriceType.FIXED,
        amount: 99.99,
        currency: 'USD'
      },
      backlinkInfo: {
        url: 'https://example.com',
        anchorText: 'Visit our website'
      }
    };

    it('returns true for valid step', () => {
      expect(isStepValid(validFormData, 1)).toBe(true);
      expect(isStepValid(validFormData, 2)).toBe(true);
      expect(isStepValid(validFormData, 3)).toBe(true);
      expect(isStepValid(validFormData, 4)).toBe(true);
      expect(isStepValid(validFormData, 5)).toBe(true);
    });

    it('returns false for invalid step', () => {
      const invalidData = { ...validFormData, title: '' };
      expect(isStepValid(invalidData, 1)).toBe(false);

      const invalidCategoriesData = { ...validFormData, categoryIds: [] };
      expect(isStepValid(invalidCategoriesData, 2)).toBe(false);
    });
  });

  describe('isFormValid', () => {
    const validFormData: ListingFormData = {
      title: 'Valid Title',
      description: 'This is a valid description that meets the minimum length requirement.',
      status: ListingStatus.DRAFT,
      categoryIds: ['category1'],
      media: [{ id: 'media1', url: 'test.jpg', type: MediaType.IMAGE, createdAt: '', updatedAt: '' }],
      price: {
        priceType: PriceType.FIXED,
        amount: 99.99,
        currency: 'USD'
      },
      backlinkInfo: {
        url: 'https://example.com',
        anchorText: 'Visit our website'
      }
    };

    it('returns true for valid form data', () => {
      expect(isFormValid(validFormData)).toBe(true);
    });

    it('returns false for invalid form data', () => {
      const invalidData = { ...validFormData, title: '' };
      expect(isFormValid(invalidData)).toBe(false);

      const invalidCategoriesData = { ...validFormData, categoryIds: [] };
      expect(isFormValid(invalidCategoriesData)).toBe(false);
    });
  });
});
