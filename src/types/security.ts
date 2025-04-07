/**
 * Login attempt information
 */
export interface LoginAttempt {
  id: string;
  timestamp: string;
  username: string;
  ipAddress: string;
  status: 'success' | 'failure' | 'blocked' | 'captcha_required';
  ipRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  userAgent: string;
  successful: boolean;
}

/**
 * Security metrics data
 */
export interface SecurityMetrics {
  failedLoginAttempts: {
    current: number;
    previous: number;
  };
  blockedIPs: {
    current: number;
    previous: number;
  };
  suspiciousActivities: {
    current: number;
    previous: number;
  };
  securityScore: {
    current: number;
    previous: number;
  };
}

/**
 * Filter options for login attempts
 */
export interface SecurityFilter {
  status?: string[];
  ipRiskLevel?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Suspicious activity report
 */
export interface SuspiciousActivityReport {
  id?: string;
  type: string;
  description: string;
  ipAddress?: string;
  username?: string;
  date?: string;
  time?: string;
  status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/**
 * User activity record
 */
export interface UserActivity {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

/**
 * Security alert
 */
export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
  affectedUsers?: string[];
  relatedIPs?: string[];
  details?: Record<string, any>;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  ipAddress: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  details?: Record<string, any>;
}

/**
 * Two-factor authentication method
 */
export interface TwoFactorMethod {
  id: string;
  userId: string;
  type: 'app' | 'sms' | 'email' | 'security_key';
  name: string;
  verified: boolean;
  createdAt: string;
  lastUsedAt?: string;
  details?: Record<string, any>;
}

/**
 * Two-factor authentication settings
 */
export interface TwoFactorSettings {
  enabled: boolean;
  requiredForLogin: boolean;
  requiredForSensitiveActions: boolean;
  rememberedDevices: number;
  methods: TwoFactorMethod[];
}
