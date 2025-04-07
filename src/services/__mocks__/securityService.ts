import { 
  LoginAttempt, 
  SecurityMetrics, 
  SecurityFilter, 
  UserActivity
} from '../../types/security';

// Mock login attempts data
const mockLoginAttempts = [
  {
    id: '1',
    timestamp: '2023-06-01T10:00:00Z',
    username: 'user1',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    success: true,
    ipRiskLevel: 'low',
    location: {
      country: 'United States',
      city: 'New York',
      latitude: 40.7128,
      longitude: -74.0060
    }
  },
  {
    id: '2',
    timestamp: '2023-06-01T11:00:00Z',
    username: 'user2',
    ip: '192.168.1.2',
    userAgent: 'Chrome/91.0',
    success: false,
    ipRiskLevel: 'high',
    location: {
      country: 'Canada',
      city: 'Toronto',
      latitude: 43.6532,
      longitude: -79.3832
    }
  }
];

// Mock security metrics data
const mockSecurityMetrics = {
  totalAttempts: 100,
  successfulAttempts: 70,
  failedAttempts: 30,
  blockedAttempts: 10,
  captchaRequiredCount: 15,
  highRiskIPs: 5
};

// Mock user activity data
const mockUserActivity = [
  {
    id: '1',
    userId: 'user1',
    action: 'login',
    timestamp: '2023-06-01T10:00:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    details: { success: true }
  },
  {
    id: '2',
    userId: 'user1',
    action: 'view_profile',
    timestamp: '2023-06-01T10:05:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    details: { profileId: 'profile1' }
  }
];

// Mock implementations
export const fetchLoginAttempts = jest.fn().mockImplementation((filter?: SecurityFilter) => {
  return Promise.resolve(mockLoginAttempts);
});

export const blockIpAddress = jest.fn().mockImplementation((ipAddress: string) => {
  return Promise.resolve();
});

export const unblockIpAddress = jest.fn().mockImplementation((ipAddress: string) => {
  return Promise.resolve();
});

export const fetchSecurityMetrics = jest.fn().mockImplementation((startDate?: string, endDate?: string) => {
  return Promise.resolve(mockSecurityMetrics);
});

export const fetchUserActivity = jest.fn().mockImplementation(
  (userId?: string, startDate?: string, endDate?: string, page: number = 1, pageSize: number = 20) => {
    return Promise.resolve(mockUserActivity);
  }
);

// Add other mock functions as needed
export const submitSuspiciousActivityReport = jest.fn().mockResolvedValue(undefined);
export const fetchSecurityAlerts = jest.fn().mockResolvedValue([]);
export const updateAlertStatus = jest.fn().mockResolvedValue(undefined);
export const fetchAuditLogs = jest.fn().mockResolvedValue([]);
export const fetchTwoFactorSettings = jest.fn().mockResolvedValue({});
export const enableTwoFactor = jest.fn().mockResolvedValue({});
export const verifyTwoFactor = jest.fn().mockResolvedValue(undefined);
export const disableTwoFactor = jest.fn().mockResolvedValue(undefined);
