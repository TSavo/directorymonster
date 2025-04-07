import { 
  LoginAttempt, 
  SecurityMetrics, 
  SecurityFilter, 
  SuspiciousActivityReport,
  UserActivity,
  SecurityAlert,
  AuditLogEntry,
  TwoFactorSettings
} from '../types/security';

/**
 * Base API URL for security endpoints
 */
const API_BASE_URL = '/api/security';

/**
 * Handles API errors and provides consistent error messages
 */
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred while processing your request';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If we can't parse the error as JSON, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(`${errorMessage} (${response.status})`);
  }
  
  return response;
};

/**
 * Fetches login attempts with optional filtering
 */
export const fetchLoginAttempts = async (filter?: SecurityFilter): Promise<LoginAttempt[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filter?.status && filter.status.length > 0) {
      filter.status.forEach(status => params.append('status', status));
    }
    
    if (filter?.ipRiskLevel && filter.ipRiskLevel.length > 0) {
      filter.ipRiskLevel.forEach(level => params.append('ipRiskLevel', level));
    }
    
    if (filter?.userId) {
      params.append('userId', filter.userId);
    }
    
    if (filter?.startDate) {
      params.append('startDate', filter.startDate);
    }
    
    if (filter?.endDate) {
      params.append('endDate', filter.endDate);
    }
    
    if (filter?.page) {
      params.append('page', filter.page.toString());
    }
    
    if (filter?.pageSize) {
      params.append('pageSize', filter.pageSize.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/login-attempts${queryString}`);
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    throw error;
  }
};

/**
 * Blocks an IP address
 */
export const blockIpAddress = async (ipAddress: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/block-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ipAddress })
    });
    
    await handleApiError(response);
  } catch (error) {
    console.error('Error blocking IP address:', error);
    throw error;
  }
};

/**
 * Unblocks an IP address
 */
export const unblockIpAddress = async (ipAddress: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/unblock-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ipAddress })
    });
    
    await handleApiError(response);
  } catch (error) {
    console.error('Error unblocking IP address:', error);
    throw error;
  }
};

/**
 * Fetches security metrics
 */
export const fetchSecurityMetrics = async (startDate?: string, endDate?: string): Promise<SecurityMetrics> => {
  try {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/metrics${queryString}`);
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    throw error;
  }
};

/**
 * Submits a suspicious activity report
 */
export const submitSuspiciousActivityReport = async (report: SuspiciousActivityReport): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report-suspicious-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    });
    
    await handleApiError(response);
  } catch (error) {
    console.error('Error submitting suspicious activity report:', error);
    throw error;
  }
};

/**
 * Fetches user activity logs
 */
export const fetchUserActivity = async (
  userId?: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<UserActivity[]> => {
  try {
    const params = new URLSearchParams();
    
    if (userId) {
      params.append('userId', userId);
    }
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/user-activity${queryString}`);
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

/**
 * Fetches security alerts
 */
export const fetchSecurityAlerts = async (
  status?: string[],
  severity?: string[],
  startDate?: string,
  endDate?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SecurityAlert[]> => {
  try {
    const params = new URLSearchParams();
    
    if (status && status.length > 0) {
      status.forEach(s => params.append('status', s));
    }
    
    if (severity && severity.length > 0) {
      severity.forEach(s => params.append('severity', s));
    }
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/alerts${queryString}`);
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    throw error;
  }
};

/**
 * Updates a security alert status
 */
export const updateAlertStatus = async (alertId: string, status: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    await handleApiError(response);
  } catch (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
};

/**
 * Fetches audit logs
 */
export const fetchAuditLogs = async (
  userId?: string,
  action?: string,
  resource?: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<AuditLogEntry[]> => {
  try {
    const params = new URLSearchParams();
    
    if (userId) {
      params.append('userId', userId);
    }
    
    if (action) {
      params.append('action', action);
    }
    
    if (resource) {
      params.append('resource', resource);
    }
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/audit-logs${queryString}`);
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Fetches two-factor authentication settings for a user
 */
export const fetchTwoFactorSettings = async (userId?: string): Promise<TwoFactorSettings> => {
  try {
    const params = new URLSearchParams();
    
    if (userId) {
      params.append('userId', userId);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/two-factor${queryString}`);
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error fetching two-factor settings:', error);
    throw error;
  }
};

/**
 * Enables two-factor authentication
 */
export const enableTwoFactor = async (
  method: 'app' | 'sms' | 'email' | 'security_key',
  details: Record<string, any>
): Promise<{ secret?: string; qrCode?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/two-factor/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ method, details })
    });
    
    await handleApiError(response);
    
    return response.json();
  } catch (error) {
    console.error('Error enabling two-factor authentication:', error);
    throw error;
  }
};

/**
 * Verifies two-factor authentication setup
 */
export const verifyTwoFactor = async (
  method: 'app' | 'sms' | 'email' | 'security_key',
  code: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/two-factor/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ method, code })
    });
    
    await handleApiError(response);
  } catch (error) {
    console.error('Error verifying two-factor authentication:', error);
    throw error;
  }
};

/**
 * Disables two-factor authentication
 */
export const disableTwoFactor = async (methodId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/two-factor/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ methodId })
    });
    
    await handleApiError(response);
  } catch (error) {
    console.error('Error disabling two-factor authentication:', error);
    throw error;
  }
};
