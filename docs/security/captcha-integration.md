# CAPTCHA Integration

This document provides a detailed overview of the CAPTCHA integration in the authentication system.

## Table of Contents

1. [Overview](#overview)
2. [Server-Side Implementation](#server-side-implementation)
   - [CAPTCHA Requirement](#captcha-requirement)
   - [CAPTCHA Verification](#captcha-verification)
   - [Risk-Based Thresholds](#risk-based-thresholds)
3. [Client-Side Implementation](#client-side-implementation)
   - [CAPTCHA Widget](#captcha-widget)
   - [reCAPTCHA Integration](#recaptcha-integration)
   - [Custom CAPTCHA Implementation](#custom-captcha-implementation)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Security Considerations](#security-considerations)

## Overview

CAPTCHA (Completely Automated Public Turing test to tell Computers and Humans Apart) is a type of challenge-response test used to determine whether the user is human. The authentication system integrates CAPTCHA to prevent automated attacks by requiring human verification after a configurable number of failed authentication attempts.

The CAPTCHA integration consists of two main components:

1. **Server-Side Implementation**: Determines when CAPTCHA is required, verifies CAPTCHA tokens, and manages CAPTCHA state.
2. **Client-Side Implementation**: Renders the CAPTCHA widget, handles user interaction, and sends CAPTCHA tokens to the server.

## Server-Side Implementation

The server-side implementation of CAPTCHA is located in `src/lib/auth/captcha-service.ts` and provides the following functionality:

### CAPTCHA Requirement

The server determines when CAPTCHA is required based on the number of failed authentication attempts from an IP address. The threshold for requiring CAPTCHA is configurable based on the risk level of the IP address.

```typescript
/**
 * Check if CAPTCHA is required for the given IP address
 * @param ipAddress The IP address to check
 * @returns True if CAPTCHA is required, false otherwise
 */
export async function isCaptchaRequired(ipAddress: string): Promise<boolean> {
  try {
    // Get the number of failed attempts for this IP
    const failedAttempts = await kv.get(`auth:captcha:${ipAddress}`);
    
    // Get the threshold for this IP based on risk level
    const threshold = await getCaptchaThreshold(ipAddress);
    
    // Require CAPTCHA if the number of failed attempts exceeds the threshold
    return failedAttempts !== null && Number(failedAttempts) >= threshold;
  } catch (error) {
    console.error('Error checking if CAPTCHA is required:', error);
    return false; // Fail open
  }
}
```

### CAPTCHA Verification

The server verifies CAPTCHA tokens using the Google reCAPTCHA API or a custom verification method if reCAPTCHA is not available.

```typescript
/**
 * Verify a CAPTCHA token
 * @param token The CAPTCHA token to verify
 * @param ipAddress The IP address of the request
 * @returns True if the token is valid, false otherwise
 */
export async function verifyCaptcha(token: string, ipAddress: string): Promise<boolean> {
  try {
    // If CAPTCHA is not required, return true
    if (!await isCaptchaRequired(ipAddress)) {
      return true;
    }
    
    // If no token is provided, return false
    if (!token) {
      return false;
    }
    
    let isValid = false;
    
    // Verify the token using reCAPTCHA if available
    if (process.env.RECAPTCHA_SECRET_KEY) {
      try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: token,
            remoteip: ipAddress
          }).toString()
        });
        
        const data = await response.json();
        isValid = data.success === true;
      } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        // Fall back to simple verification
        isValid = token.length > 20; // Simple check for token length
      }
    } else {
      // If reCAPTCHA is not available, use a simple verification method
      isValid = token.length > 20; // Simple check for token length
    }
    
    // If the token is valid, store the verification
    if (isValid) {
      await kv.set(`auth:captcha:verify:${ipAddress}`, {
        verifiedAt: Date.now(),
        token: crypto.createHash('sha256').update(token).digest('hex')
      }, { ex: 60 * 5 }); // Store for 5 minutes
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return false; // Fail closed
  }
}
```

### Risk-Based Thresholds

The server uses risk-based thresholds to determine when CAPTCHA is required. The threshold is lower for high-risk IP addresses and higher for low-risk IP addresses.

```typescript
/**
 * Get the CAPTCHA threshold for the given IP address based on risk level
 * @param ipAddress The IP address to get the threshold for
 * @returns The CAPTCHA threshold
 */
export async function getCaptchaThreshold(ipAddress: string): Promise<number> {
  try {
    // Get the risk level for this IP
    const riskLevel = await getIpRiskLevel(ipAddress);
    
    // Return the threshold based on risk level
    switch (riskLevel) {
      case RiskLevel.LOW:
        return 5; // Require CAPTCHA after 5 failed attempts for low-risk IPs
      case RiskLevel.MEDIUM:
        return 2; // Require CAPTCHA after 2 failed attempts for medium-risk IPs
      case RiskLevel.HIGH:
        return 1; // Require CAPTCHA after 1 failed attempt for high-risk IPs
      default:
        return 3; // Default threshold
    }
  } catch (error) {
    console.error('Error getting CAPTCHA threshold:', error);
    return 3; // Default threshold
  }
}
```

## Client-Side Implementation

The client-side implementation of CAPTCHA is located in `src/components/admin/auth/CaptchaWidget.tsx` and provides the following functionality:

### CAPTCHA Widget

The CAPTCHA widget is a React component that renders either a Google reCAPTCHA widget or a custom CAPTCHA implementation, depending on the configuration.

```tsx
/**
 * CAPTCHA Widget Component
 * 
 * This component renders a CAPTCHA widget for user verification.
 * It supports both Google reCAPTCHA and a custom CAPTCHA implementation.
 */
const CaptchaWidget = React.forwardRef<
  { reset: () => void; execute: () => void },
  CaptchaWidgetProps
>(function CaptchaWidget(props, ref) {
  const {
    onVerify,
    onExpire,
    onError,
    siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
    theme = 'light',
    size = 'normal',
    invisible = false,
    useCustomCaptcha = false
  } = props;
  
  // Component state
  const [isLoaded, setIsLoaded] = useState(false);
  const [customCaptchaCode, setCustomCaptchaCode] = useState('');
  const [customCaptchaInput, setCustomCaptchaInput] = useState('');
  const [customCaptchaError, setCustomCaptchaError] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  
  // ... (component implementation)
  
  // Render the appropriate CAPTCHA widget
  if (useCustomCaptcha) {
    return (
      <div className="custom-captcha-container p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
        {/* Custom CAPTCHA implementation */}
      </div>
    );
  } else {
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
  }
});
```

### reCAPTCHA Integration

The CAPTCHA widget integrates with Google reCAPTCHA when a site key is provided. It loads the reCAPTCHA script, renders the widget, and handles verification callbacks.

```tsx
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
```

### Custom CAPTCHA Implementation

The CAPTCHA widget includes a custom CAPTCHA implementation that can be used when reCAPTCHA is not available. The custom implementation generates a random code, renders it with visual distortion, and verifies user input.

```tsx
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
```

## Configuration

The CAPTCHA integration is highly configurable to adapt to different security requirements. The following configuration options are available:

### Server-Side Configuration

- **CAPTCHA Thresholds**: The number of failed attempts before requiring CAPTCHA, based on IP risk level.
  - Low Risk: 5 failed attempts
  - Medium Risk: 2 failed attempts
  - High Risk: 1 failed attempt
- **reCAPTCHA Secret Key**: The secret key for Google reCAPTCHA, set via the `RECAPTCHA_SECRET_KEY` environment variable.
- **Verification Expiry**: The duration for which a CAPTCHA verification is valid, set to 5 minutes.

### Client-Side Configuration

- **reCAPTCHA Site Key**: The site key for Google reCAPTCHA, set via the `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` environment variable.
- **CAPTCHA Type**: Whether to use Google reCAPTCHA or the custom CAPTCHA implementation, controlled by the `useCustomCaptcha` prop.
- **reCAPTCHA Theme**: The theme for the reCAPTCHA widget, either 'light' or 'dark'.
- **reCAPTCHA Size**: The size of the reCAPTCHA widget, either 'normal' or 'compact'.
- **Invisible reCAPTCHA**: Whether to use the invisible reCAPTCHA, controlled by the `invisible` prop.

## Testing

The CAPTCHA integration is thoroughly tested to ensure its effectiveness:

### Server-Side Tests

- **CAPTCHA Requirement Tests**: Tests for determining when CAPTCHA is required based on failed attempts and risk level.
- **CAPTCHA Verification Tests**: Tests for verifying CAPTCHA tokens using both reCAPTCHA and the custom verification method.
- **Risk-Based Threshold Tests**: Tests for determining the CAPTCHA threshold based on IP risk level.

### Client-Side Tests

- **CAPTCHA Widget Tests**: Tests for rendering the CAPTCHA widget in both reCAPTCHA and custom CAPTCHA modes.
- **reCAPTCHA Integration Tests**: Tests for loading the reCAPTCHA script, rendering the widget, and handling verification callbacks.
- **Custom CAPTCHA Tests**: Tests for generating random codes, rendering the custom CAPTCHA, and verifying user input.
- **Accessibility Tests**: Tests for ensuring that the CAPTCHA widget is accessible to all users.

## Security Considerations

The CAPTCHA integration includes several security considerations:

### Fallback Mechanism

The system includes a fallback mechanism for when reCAPTCHA is not available. If the reCAPTCHA script fails to load or the verification API is unavailable, the system falls back to a custom CAPTCHA implementation.

### Token Verification

CAPTCHA tokens are verified on the server to prevent client-side bypassing. The server uses the Google reCAPTCHA API to verify tokens when reCAPTCHA is available, and a simple length check when it is not.

### Risk-Based Thresholds

The system uses risk-based thresholds to determine when CAPTCHA is required. High-risk IP addresses are required to complete CAPTCHA after fewer failed attempts than low-risk IP addresses.

### Accessibility

The CAPTCHA widget includes accessibility features to ensure that it is usable by all users, including those with disabilities. The custom CAPTCHA implementation includes proper ARIA attributes and keyboard navigation support.
