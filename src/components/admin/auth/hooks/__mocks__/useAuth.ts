'use client';

import { useState, useCallback } from 'react';
import { User } from '../../../users/hooks/useUsers';
import { ResourceType, Permission, hasPermission as checkPermission } from '../../utils/accessControl';

// Mock version of useAuth that doesn't use useRouter
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Create a mock implementation for testing
export const useAuth = jest.fn().mockReturnValue({
  user: { id: 'user-123', name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: jest.fn().mockResolvedValue(true),
  logout: jest.fn().mockResolvedValue(true),
  hasPermission: jest.fn().mockReturnValue(true)
});

export default useAuth;