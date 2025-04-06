'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';

interface UnifiedAuthComponentProps {
  className?: string;
  position?: 'left' | 'right' | 'center';
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function UnifiedAuthComponent({
  className,
  position = 'right',
  onAuthChange
}: UnifiedAuthComponentProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Position classes
  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Notify parent component when auth state changes
  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(isAuthenticated);
    }
  }, [isAuthenticated, onAuthChange]);

  // Handle login button click
  const handleLoginClick = () => {
    router.push('/login');
  };

  // Handle logout button click
  const handleLogoutClick = () => {
    logout();
    setIsDropdownOpen(false);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleDropdown();
    }
  };

  return (
    <div
      data-testid="unified-auth-component"
      className={`flex ${positionClasses[position]} ${className || ''}`}
    >
      {!isAuthenticated ? (
        // Unauthenticated state - show Log In button
        <button
          onClick={handleLoginClick}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Log In"
        >
          Log In
        </button>
      ) : (
        // Authenticated state - show user info and dropdown
        <div className="relative" ref={dropdownRef}>
          <button
            ref={buttonRef}
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            id="user-menu-button"
          >
            {user?.username}
          </button>

          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10"
              role="menu"
              aria-labelledby="user-menu-button"
            >
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  role="menuitem"
                >
                  Profile
                </button>
                {user?.role === 'admin' && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Admin
                  </div>
                )}
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  role="menuitem"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
