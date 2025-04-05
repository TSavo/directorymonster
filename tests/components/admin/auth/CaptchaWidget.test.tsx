/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaptchaWidget from '@/components/admin/auth/CaptchaWidget';

// Mock the Next.js Script component
jest.mock('next/script', () => {
  return function MockScript({ onLoad, onError }: { onLoad?: () => void; onError?: (e: Error) => void }) {
    // Call onLoad after a short delay to simulate script loading
    React.useEffect(() => {
      if (onLoad) {
        setTimeout(onLoad, 10);
      }
    }, [onLoad]);
    
    return null;
  };
});

// Mock the global grecaptcha object
const mockRender = jest.fn();
const mockReset = jest.fn();
const mockExecute = jest.fn();

// Mock window.grecaptcha
Object.defineProperty(window, 'grecaptcha', {
  value: {
    ready: (callback: () => void) => callback(),
    render: mockRender.mockImplementation(() => 1), // Return widget ID
    reset: mockReset,
    execute: mockExecute
  },
  writable: true
});

describe('CaptchaWidget', () => {
  const mockOnVerify = jest.fn();
  const mockOnExpire = jest.fn();
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('reCAPTCHA Mode', () => {
    it('should render the reCAPTCHA widget', async () => {
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
      
      // Check that the widget was rendered with the correct parameters
      expect(mockRender).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sitekey: 'test-site-key',
          theme: 'light',
          size: 'normal',
          callback: expect.any(Function),
          'expired-callback': expect.any(Function),
          'error-callback': expect.any(Function)
        })
      );
    });
    
    it('should call onVerify when the CAPTCHA is verified', async () => {
      // Render the component
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          siteKey="test-site-key"
        />
      );
      
      // Wait for the script to load and the widget to render
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
      
      // Get the callback function
      const callback = mockRender.mock.calls[0][1].callback;
      
      // Call the callback with a token
      callback('test-token');
      
      // Check that onVerify was called with the token
      expect(mockOnVerify).toHaveBeenCalledWith('test-token');
    });
    
    it('should call onExpire when the CAPTCHA expires', async () => {
      // Render the component
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          onExpire={mockOnExpire}
          siteKey="test-site-key"
        />
      );
      
      // Wait for the script to load and the widget to render
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
      
      // Get the expired callback function
      const expiredCallback = mockRender.mock.calls[0][1]['expired-callback'];
      
      // Call the expired callback
      expiredCallback();
      
      // Check that onExpire was called
      expect(mockOnExpire).toHaveBeenCalled();
    });
    
    it('should call onError when the CAPTCHA encounters an error', async () => {
      // Render the component
      render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          onError={mockOnError}
          siteKey="test-site-key"
        />
      );
      
      // Wait for the script to load and the widget to render
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
      
      // Get the error callback function
      const errorCallback = mockRender.mock.calls[0][1]['error-callback'];
      
      // Call the error callback with an error
      const testError = new Error('Test error');
      errorCallback(testError);
      
      // Check that onError was called with the error
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });
    
    it('should reset the CAPTCHA when the reset method is called', async () => {
      // Create a ref to access the component methods
      const ref = React.createRef<{ reset: () => void; execute: () => void }>();
      
      // Render the component with the ref
      render(
        <CaptchaWidget
          ref={ref}
          onVerify={mockOnVerify}
          siteKey="test-site-key"
        />
      );
      
      // Wait for the script to load and the widget to render
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
      
      // Call the reset method
      ref.current?.reset();
      
      // Check that grecaptcha.reset was called with the widget ID
      expect(mockReset).toHaveBeenCalledWith(1);
    });
    
    it('should execute the CAPTCHA when the execute method is called', async () => {
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
      ref.current?.execute();
      
      // Check that grecaptcha.execute was called with the widget ID
      expect(mockExecute).toHaveBeenCalledWith(1);
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
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new code/i })).toBeInTheDocument();
    });
    
    it('should verify the custom CAPTCHA when the correct code is entered', async () => {
      // Render the component in custom CAPTCHA mode
      const { container } = render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );
      
      // Get the CAPTCHA code from the component
      const codeElement = container.querySelector('.captcha-code');
      const code = codeElement?.textContent || '';
      
      // Enter the code
      const input = screen.getByPlaceholderText('Enter the code above');
      fireEvent.change(input, { target: { value: code } });
      
      // Click the verify button
      const verifyButton = screen.getByRole('button', { name: /verify/i });
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
      const verifyButton = screen.getByRole('button', { name: /verify/i });
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
      const { container } = render(
        <CaptchaWidget
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );
      
      // Get the initial CAPTCHA code
      const codeElement = container.querySelector('.captcha-code');
      const initialCode = codeElement?.textContent || '';
      
      // Click the reset button
      const resetButton = screen.getByRole('button', { name: /new code/i });
      fireEvent.click(resetButton);
      
      // Get the new CAPTCHA code
      const newCode = codeElement?.textContent || '';
      
      // Check that the code has changed
      expect(newCode).not.toBe(initialCode);
    });
    
    it('should reset the custom CAPTCHA when the reset method is called', () => {
      // Create a ref to access the component methods
      const ref = React.createRef<{ reset: () => void; execute: () => void }>();
      
      // Render the component with the ref in custom CAPTCHA mode
      const { container } = render(
        <CaptchaWidget
          ref={ref}
          onVerify={mockOnVerify}
          useCustomCaptcha={true}
        />
      );
      
      // Get the initial CAPTCHA code
      const codeElement = container.querySelector('.captcha-code');
      const initialCode = codeElement?.textContent || '';
      
      // Call the reset method
      ref.current?.reset();
      
      // Get the new CAPTCHA code
      const newCode = codeElement?.textContent || '';
      
      // Check that the code has changed
      expect(newCode).not.toBe(initialCode);
    });
  });
});
