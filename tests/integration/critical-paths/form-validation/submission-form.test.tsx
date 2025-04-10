/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from '../TestWrapper';

// Mock the submission form component
const SubmissionForm = () => {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.website && !/^https?:\/\//.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate successful submission
        setIsSuccess(true);
      } catch (error) {
        setSubmitError('An error occurred while submitting the form. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      {isSuccess ? (
        <div data-testid="success-message">
          <h2>Submission Successful!</h2>
          <p>Thank you for your submission. We will review it shortly.</p>
          <button
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                category: '',
                email: '',
                phone: '',
                website: '',
                agreeToTerms: false,
              });
              setIsSuccess(false);
            }}
            data-testid="new-submission-button"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} data-testid="submission-form">
          {submitError && (
            <div role="alert" data-testid="submit-error">
              {submitError}
            </div>
          )}

          <div>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
              data-testid="title-input"
            />
            {errors.title && (
              <div id="title-error" role="alert" data-testid="title-error">
                {errors.title}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
              data-testid="description-input"
            />
            {errors.description && (
              <div id="description-error" role="alert" data-testid="description-error">
                {errors.description}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
              data-testid="category-select"
            >
              <option value="">Select a category</option>
              <option value="business">Business</option>
              <option value="technology">Technology</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
            </select>
            {errors.category && (
              <div id="category-error" role="alert" data-testid="category-error">
                {errors.category}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              data-testid="email-input"
            />
            {errors.email && (
              <div id="email-error" role="alert" data-testid="email-error">
                {errors.email}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              data-testid="phone-input"
            />
          </div>

          <div>
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              aria-invalid={!!errors.website}
              aria-describedby={errors.website ? 'website-error' : undefined}
              data-testid="website-input"
            />
            {errors.website && (
              <div id="website-error" role="alert" data-testid="website-error">
                {errors.website}
              </div>
            )}
          </div>

          <div>
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              aria-invalid={!!errors.agreeToTerms}
              aria-describedby={errors.agreeToTerms ? 'terms-error' : undefined}
              data-testid="terms-checkbox"
            />
            <label htmlFor="agreeToTerms">
              I agree to the terms and conditions *
            </label>
            {errors.agreeToTerms && (
              <div id="terms-error" role="alert" data-testid="terms-error">
                {errors.agreeToTerms}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
};

describe('Submission Form Validation', () => {
  it('displays validation errors when submitting an empty form', async () => {
    renderWithWrapper(<SubmissionForm />);

    // Submit the form without entering any data
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toBeInTheDocument();
      expect(screen.getByTestId('description-error')).toBeInTheDocument();
      expect(screen.getByTestId('category-error')).toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByTestId('terms-error')).toBeInTheDocument();
    });
  });

  it('validates form fields', async () => {
    renderWithWrapper(<SubmissionForm />);

    // Submit the form without entering any data
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toBeInTheDocument();
    });

    // Fill in the title field
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Title' } });

    // Submit the form again
    fireEvent.click(submitButton);

    // Check that title error is gone but other errors remain
    await waitFor(() => {
      expect(screen.queryByTestId('title-error')).not.toBeInTheDocument();
      expect(screen.getByTestId('description-error')).toBeInTheDocument();
    });
  });

  it('validates form completion', async () => {
    renderWithWrapper(<SubmissionForm />);

    // Fill in all required fields
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'This is a test description that is long enough to pass validation.' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'business' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByTestId('terms-checkbox'));

    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));

    // Check that the form submits successfully
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('submits the form successfully with valid data', async () => {
    renderWithWrapper(<SubmissionForm />);

    // Fill in all required fields with valid data
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'This is a test description that is long enough to pass validation.' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'business' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByTestId('website-input'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByTestId('terms-checkbox'));

    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));

    // Check that the button shows loading state
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Submitting...');
    expect(screen.getByTestId('submit-button')).toBeDisabled();

    // Check that the success message is displayed after the API call
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // Check the success message
    expect(screen.getByTestId('success-message')).toHaveTextContent('Submission Successful!');

    // Check that the "Submit Another" button is displayed
    expect(screen.getByTestId('new-submission-button')).toBeInTheDocument();
  });

  it('resets the form when clicking "Submit Another"', async () => {
    renderWithWrapper(<SubmissionForm />);

    // Fill in all required fields with valid data
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'This is a test description that is long enough to pass validation.' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'business' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByTestId('terms-checkbox'));

    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));

    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // Click the "Submit Another" button
    fireEvent.click(screen.getByTestId('new-submission-button'));

    // Check that the form is displayed again
    await waitFor(() => {
      expect(screen.getByTestId('submission-form')).toBeInTheDocument();
    });

    // Check that the form fields are reset
    expect(screen.getByTestId('title-input')).toHaveValue('');
    expect(screen.getByTestId('description-input')).toHaveValue('');
    expect(screen.getByTestId('category-select')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');
    expect(screen.getByTestId('terms-checkbox')).not.toBeChecked();
  });
});
