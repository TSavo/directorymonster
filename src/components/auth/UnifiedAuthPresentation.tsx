import React from 'react';
import { Button } from '@/components/ui/Button';

export interface UnifiedAuthPresentationProps {
  isAuthenticated: boolean;
  username?: string;
  isAdmin?: boolean;
  isDropdownOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  positionClass: string;
  className?: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onToggleDropdown: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Presentation component for unified authentication UI
 * Handles only rendering, no state or business logic
 */
export function UnifiedAuthPresentation({
  isAuthenticated,
  username,
  isAdmin,
  isDropdownOpen,
  dropdownRef,
  buttonRef,
  positionClass,
  className,
  onLoginClick,
  onLogoutClick,
  onToggleDropdown,
  onKeyDown
}: UnifiedAuthPresentationProps) {
  return (
    <div
      data-testid="unified-auth-component"
      className={`flex ${positionClass} ${className || ''}`}
    >
      {!isAuthenticated ? (
        // Unauthenticated state - show Log In button
        <Button
          variant="secondary"
          onClick={onLoginClick}
          aria-label="Log In"
          data-testid="login-button"
        >
          Log In
        </Button>
      ) : (
        // Authenticated state - show user info and dropdown
        <div className="relative" ref={dropdownRef}>
          <Button
            ref={buttonRef}
            variant="secondary"
            onClick={onToggleDropdown}
            onKeyDown={onKeyDown}
            className="flex items-center"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            id="user-menu-button"
            data-testid="user-menu-button"
          >
            {username}
          </Button>

          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10"
              role="menu"
              aria-labelledby="user-menu-button"
              data-testid="user-dropdown"
            >
              <div className="py-1">
                <Button
                  variant="ghost"
                  className="w-full text-left justify-start px-4 py-2 hover:bg-gray-100"
                  role="menuitem"
                  data-testid="profile-button"
                >
                  Profile
                </Button>
                {isAdmin && (
                  <div className="px-4 py-2 text-sm text-gray-500" data-testid="admin-indicator">
                    Admin
                  </div>
                )}
                <Button
                  variant="ghost"
                  onClick={onLogoutClick}
                  className="w-full text-left justify-start px-4 py-2 hover:bg-gray-100"
                  role="menuitem"
                  data-testid="logout-button"
                >
                  Log Out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
