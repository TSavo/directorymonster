'use client';

import React from 'react';
import { UnifiedAuthContainer } from './UnifiedAuthContainer';

interface UnifiedAuthComponentProps {
  className?: string;
  position?: 'left' | 'right' | 'center';
  onAuthChange?: (isAuthenticated: boolean) => void;
}

/**
 * Main export component for unified authentication
 * This is a thin wrapper around the container component for backward compatibility
 */
export function UnifiedAuthComponent(props: UnifiedAuthComponentProps) {
  return <UnifiedAuthContainer {...props} />;
}
