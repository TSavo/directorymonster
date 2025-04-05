/**
 * CAPTCHA Widget Component
 *
 * This component renders a CAPTCHA widget for user verification.
 * It supports both Google reCAPTCHA and a custom CAPTCHA implementation.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface CaptchaWidgetProps {
  /**
   * Callback function that receives the CAPTCHA token when verified
   */
  onVerify: (token: string) => void;

  /**
   * Callback function that is called when the CAPTCHA expires
   */
  onExpire?: () => void;

  /**
   * Callback function that is called when the CAPTCHA encounters an error
   */
  onError?: (error: Error) => void;

  /**
   * The site key for reCAPTCHA
   * @default process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
   */
  siteKey?: string;

  /**
   * The theme for the CAPTCHA widget
   * @default 'light'
   */
  theme?: 'light' | 'dark';

  /**
   * The size of the CAPTCHA widget
   * @default 'normal'
   */
  size?: 'normal' | 'compact';

  /**
   * Whether to use the invisible reCAPTCHA
   * @default false
   */
  invisible?: boolean;

  /**
   * Whether to use a custom CAPTCHA implementation instead of reCAPTCHA
   * @default false
   */
  useCustomCaptcha?: boolean;
}

/**
 * CAPTCHA Widget Component
 */
const CaptchaWidget = React.forwardRef<
  { reset: () => void; execute: () => void },
  CaptchaWidgetProps
>(({
  onVerify,
  onExpire,
  onError,
  siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  theme = 'light',
  size = 'normal',
  invisible = false,
  useCustomCaptcha = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [customCaptchaCode, setCustomCaptchaCode] = useState('');
  const [customCaptchaInput, setCustomCaptchaInput] = useState('');
  const [customCaptchaError, setCustomCaptchaError] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  // Generate a random code for the custom CAPTCHA
  useEffect(() => {
    if (useCustomCaptcha) {
      const generateRandomCode = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };

      setCustomCaptchaCode(generateRandomCode());
    }
  }, [useCustomCaptcha]);

  // Initialize reCAPTCHA when the script is loaded
  useEffect(() => {
    if (!useCustomCaptcha && isLoaded && captchaRef.current && window.grecaptcha && siteKey) {
      try {
        window.grecaptcha.ready(() => {
          try {
            widgetId.current = window.grecaptcha.render(captchaRef.current!, {
              sitekey: siteKey,
              theme,
              size: invisible ? 'invisible' : size,
              callback: (token: string) => {
                onVerify(token);
              },
              'expired-callback': () => {
                if (onExpire) onExpire();
              },
              'error-callback': (error: Error) => {
                if (onError) onError(error);
              },
            });
          } catch (error) {
            console.error('Error rendering reCAPTCHA:', error);
            if (onError) onError(error as Error);
          }
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        if (onError) onError(error as Error);
      }
    }
  }, [isLoaded, siteKey, theme, size, invisible, onVerify, onExpire, onError, useCustomCaptcha]);

  // Handle custom CAPTCHA verification
  const handleCustomCaptchaSubmit = () => {
    if (customCaptchaInput.toLowerCase() === customCaptchaCode.toLowerCase()) {
      // Generate a token-like string for the custom CAPTCHA
      const token = `custom_${Date.now()}_${btoa(customCaptchaCode)}`;
      onVerify(token);
      setCustomCaptchaError('');
    } else {
      setCustomCaptchaError('Incorrect code. Please try again.');
      if (onError) onError(new Error('Custom CAPTCHA verification failed'));
    }
  };

  // Reset the custom CAPTCHA
  const resetCustomCaptcha = () => {
    const generateRandomCode = () => {
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    setCustomCaptchaCode(generateRandomCode());
    setCustomCaptchaInput('');
    setCustomCaptchaError('');
  };

  // Reset the reCAPTCHA
  const resetReCaptcha = () => {
    if (!useCustomCaptcha && isLoaded && window.grecaptcha && widgetId.current !== null) {
      try {
        window.grecaptcha.reset(widgetId.current);
      } catch (error) {
        console.error('Error resetting reCAPTCHA:', error);
        if (onError) onError(error as Error);
      }
    }
  };

  // Public method to reset the CAPTCHA
  React.useImperativeHandle(
    captchaRef,
    () => ({
      reset: () => {
        if (useCustomCaptcha) {
          resetCustomCaptcha();
        } else {
          resetReCaptcha();
        }
      },
      execute: () => {
        if (!useCustomCaptcha && isLoaded && window.grecaptcha && widgetId.current !== null && invisible) {
          try {
            window.grecaptcha.execute(widgetId.current);
          } catch (error) {
            console.error('Error executing reCAPTCHA:', error);
            if (onError) onError(error as Error);
          }
        }
      },
    }),
    [isLoaded, useCustomCaptcha, invisible]
  );

  // Render the custom CAPTCHA
  if (useCustomCaptcha) {
    return (
      <div className="custom-captcha-container p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="mb-4">
          <div className="captcha-code p-2 bg-white dark:bg-gray-700 rounded-md text-center font-mono text-lg tracking-wider select-none"
               style={{
                 background: `linear-gradient(45deg, #f0f0f0, #e0e0e0)`,
                 textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                 letterSpacing: '0.25em'
               }}>
            {customCaptchaCode.split('').map((char, index) => (
              <span key={index} style={{
                transform: `rotate(${Math.random() * 20 - 10}deg)`,
                display: 'inline-block',
                margin: '0 2px'
              }}>
                {char}
              </span>
            ))}
          </div>
        </div>
        <div className="mb-2">
          <input
            type="text"
            value={customCaptchaInput}
            onChange={(e) => setCustomCaptchaInput(e.target.value)}
            placeholder="Enter the code above"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="CAPTCHA verification code"
          />
        </div>
        {customCaptchaError && (
          <div className="text-red-500 text-sm mb-2">{customCaptchaError}</div>
        )}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={resetCustomCaptcha}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label="Reset CAPTCHA"
          >
            ↻ New Code
          </button>
          <button
            type="button"
            onClick={handleCustomCaptchaSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Verify CAPTCHA"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  // Render the reCAPTCHA
  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=explicit`}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error('Error loading reCAPTCHA script:', e);
          if (onError) onError(new Error('Failed to load reCAPTCHA script'));
        }}
      />
      <div ref={captchaRef} className="g-recaptcha" data-sitekey={siteKey} />
    </>
  );
}));

export default CaptchaWidget;
