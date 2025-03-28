'use client';

import React from 'react';
import { useAuth } from './SessionManager';

interface LogoutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'text';
  label?: string;
}

export function LogoutButton({
  className = '',
  variant = 'primary',
  label = 'Logout',
}: LogoutButtonProps) {
  const { logout } = useAuth();
  
  // Generate button class based on variant
  const getButtonClass = () => {
    const baseClass = 'flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none';
    
    switch (variant) {
      case 'primary':
        return `${baseClass} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`;
      case 'secondary':
        return `${baseClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`;
      case 'text':
        return `${baseClass} text-indigo-600 hover:text-indigo-800 focus:ring-2 focus:ring-indigo-500`;
      default:
        return baseClass;
    }
  };
  
  return (
    <button
      type="button"
      onClick={logout}
      className={`${getButtonClass()} ${className}`}
    >
      {label}
    </button>
  );
}
