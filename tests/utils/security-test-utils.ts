import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { LoginAttempt } from '../../src/types/security';

/**
 * Custom render function that includes common providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

/**
 * Generate mock login attempts for testing
 */
export const generateMockLoginAttempts = (count: number = 10): LoginAttempt[] => {
  const attempts: LoginAttempt[] = [];
  
  const statuses = ['success', 'failure', 'blocked', 'captcha_required'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin', 'Paris'];
  const countries = ['United States', 'United Kingdom', 'Japan', 'Australia', 'Germany', 'France'];
  
  for (let i = 1; i <= count; i++) {
    const statusIndex = i % statuses.length;
    const riskIndex = i % riskLevels.length;
    const locationIndex = i % cities.length;
    
    attempts.push({
      id: `attempt-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(), // Each attempt 1 hour apart
      username: `user${i}@example.com`,
      ipAddress: `192.168.1.${i}`,
      status: statuses[statusIndex],
      ipRiskLevel: riskLevels[riskIndex],
      location: {
        city: cities[locationIndex],
        country: countries[locationIndex],
        lat: 40.7128 + (i * 0.01),
        lng: -74.0060 + (i * 0.01)
      },
      userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.${i} Safari/537.36`,
      successful: statuses[statusIndex] === 'success'
    });
  }
  
  return attempts;
};

/**
 * Generate mock security metrics for testing
 */
export const generateMockSecurityMetrics = (options?: {
  failedLoginAttempts?: { current: number; previous: number };
  blockedIPs?: { current: number; previous: number };
  suspiciousActivities?: { current: number; previous: number };
  securityScore?: { current: number; previous: number };
}) => {
  return {
    failedLoginAttempts: options?.failedLoginAttempts || { current: 42, previous: 38 },
    blockedIPs: options?.blockedIPs || { current: 15, previous: 12 },
    suspiciousActivities: options?.suspiciousActivities || { current: 8, previous: 10 },
    securityScore: options?.securityScore || { current: 85, previous: 80 }
  };
};

/**
 * Wait for all pending promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

export * from '@testing-library/react';
export { customRender as render };
