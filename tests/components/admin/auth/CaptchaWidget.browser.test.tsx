/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaptchaWidget from '@/components/admin/auth/CaptchaWidget';

// Mock the Next.js Script component
jest.mock('next/script', () => {
  return function MockScript({ onLoad, onError }: { onLoad?: () => void; onError?: (e: Error) => void }) {
    // Call onLoad after a short delay to simulate script loading
    React.useEffect(() => {
      if (onLoad) {
        setTimeout(() => {
          act(() => {
            onLoad();
          });
        }, 10);
      }
    }, [onLoad]);

    return null;
  };
});

// Mock the global grecaptcha object
const mockRender = jest.fn();
const mockReset = jest.fn();
const mockExecute = jest.fn();

describe('CaptchaWidget Browser Tests', () => {
  const mockOnVerify = jest.fn();
  const mockOnExpire = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.grecaptcha
    Object.defineProperty(window, 'grecaptcha', {
      value: {
        ready: (callback: () => void) => callback(),
        render: mockRender.mockImplementation((element, options) => {
          // Call the callback with a token
          if (options.callback) {
            setTimeout(() => {
              act(() => {
                options.callback('test-token');
              });
            }, 50);
          }
          return 1; // Return widget ID
        }),
        reset: mockReset,
        execute: mockExecute
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Clean up
    delete (window as any).grecaptcha;
  });

  describe('reCAPTCHA Mode', () => {
    it('should render and verify with reCAPTCHA', async () => {
      // Render the component
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          onExpire={mockOnExpire}
          onError={mockOnError}
          siteKey="test-site-key"
        />
      );

      // Wait for the script to load and the widget to render
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });

      // Wait for the callback to be called
      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith('test-token');
      });
    });

    it('should handle invisible reCAPTCHA execution', async () => {
      // Create a ref to access the component methods
      const ref = React.createRef<{ reset: () => void; execute: () => void }>();

      // Render the component with the ref and invisible mode
      render(
        <CaptchaWidget
          ref={ref}
          onVerify={mockOnVerify}
          siteKey="test-site-key"
          invisible={true}
        />
      );

      // Wait for the script to load and the widget to render
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });

      // Call the execute method
      act(() => {
        ref.current?.execute();
      });

      // Check that grecaptcha.execute was called
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should handle script loading error', async () => {
      // Mock the Script component to trigger an error
      jest.resetModules();
      jest.mock('next/script', () => {
        return function MockScript({ onError }: { onLoad?: () => void; onError?: (e: Error) => void }) {
          // Call onError after a short delay to simulate script loading error
          React.useEffect(() => {
            if (onError) {
              setTimeout(() => {
                act(() => {
                  onError(new Error('Failed to load script'));
                });
              }, 10);
            }
          }, [onError]);

          return null;
        };
      });

      // Re-import the component to use the updated mock
      const { default: CaptchaWidgetWithError } = require('@/components/admin/auth/CaptchaWidget');

      // Render the component
      render(
        <CaptchaWidgetWithError
          onVerify={mockOnVerify}
          onError={mockOnError}
          siteKey="test-site-key"
        />
      );

      // Wait for the error to be called
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      // Check that the error message is correct
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Custom CAPTCHA Mode', () => {
    it('should render the custom CAPTCHA widget', () => {
      // Render the component in custom CAPTCHA mode
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );

      // Check that the custom CAPTCHA elements are rendered
      expect(screen.getByPlaceholderText('Enter the code above')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Verify CAPTCHA' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset CAPTCHA' })).toBeInTheDocument();
    });

    it('should verify the custom CAPTCHA when the correct code is entered', async () => {
      // Use a fixed code for testing
      const mockMath = Object.create(global.Math);
      mockMath.random = () => 0.5;
      global.Math = mockMath;

      // Render the component in custom CAPTCHA mode
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );

      // Get the CAPTCHA code from the component
      const captchaContainer = screen.getByTestId('captcha-code');
      const code = captchaContainer.textContent || '';

      // Enter the code
      const input = screen.getByPlaceholderText('Enter the code above');
      fireEvent.change(input, { target: { value: code } });

      // Click the verify button
      const verifyButton = screen.getByRole('button', { name: 'Verify CAPTCHA' });
      fireEvent.click(verifyButton);

      // Check that onVerify was called with a token
      expect(mockOnVerify).toHaveBeenCalled();
      expect(mockOnVerify.mock.calls[0][0]).toContain('custom_');
    });

    it('should show an error when an incorrect code is entered', () => {
      // Render the component in custom CAPTCHA mode
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          onError={mockOnError}
          useCustomCaptcha={true}
        />
      );

      // Enter an incorrect code
      const input = screen.getByPlaceholderText('Enter the code above');
      fireEvent.change(input, { target: { value: 'wrong-code' } });

      // Click the verify button
      const verifyButton = screen.getByRole('button', { name: 'Verify CAPTCHA' });
      fireEvent.click(verifyButton);

      // Check that onVerify was not called
      expect(mockOnVerify).not.toHaveBeenCalled();

      // Check that onError was called
      expect(mockOnError).toHaveBeenCalled();

      // Check that an error message is displayed
      expect(screen.getByText(/incorrect code/i)).toBeInTheDocument();
    });

    it('should generate a new code when the reset button is clicked', () => {
      // Render the component in custom CAPTCHA mode
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );

      // Get the initial CAPTCHA code
      const captchaContainer = screen.getByTestId('captcha-code');
      const initialCode = captchaContainer.textContent || '';

      // Mock Math.random to return different values for the new code
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.9);

      // Click the reset button
      const resetButton = screen.getByRole('button', { name: 'Reset CAPTCHA' });
      fireEvent.click(resetButton);

      // Get the new CAPTCHA code
      const newCodeElement = screen.getByTestId('captcha-code');
      const newCode = newCodeElement.textContent || '';

      // Check that the code has changed
      expect(newCode).not.toBe(initialCode);

      // Restore Math.random
      Math.random = originalRandom;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Render the component in custom CAPTCHA mode
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );

      // Check that the input has proper ARIA attributes
      const input = screen.getByPlaceholderText('Enter the code above');
      expect(input).toHaveAttribute('aria-label', 'CAPTCHA verification code');

      // Check that the buttons have proper ARIA attributes
      const verifyButton = screen.getByRole('button', { name: 'Verify CAPTCHA' });
      expect(verifyButton).toHaveAttribute('aria-label', 'Verify CAPTCHA');

      const resetButton = screen.getByLabelText('Reset CAPTCHA');
      expect(resetButton).toHaveAttribute('aria-label', 'Reset CAPTCHA');
    });
  });
});
