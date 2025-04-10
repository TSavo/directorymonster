import React from 'react';
import { useAuthDropdown } from './hooks/useAuthDropdown';
import { UnifiedAuthPresentation } from './UnifiedAuthPresentation';

interface UnifiedAuthContainerProps {
  className?: string;
  position?: 'left' | 'right' | 'center';
  onAuthChange?: (isAuthenticated: boolean) => void;
  authHook?: typeof useAuthDropdown;
}

/**
 * Container component for unified authentication
 * Handles state and business logic, delegates rendering to presentation component
 */
export function UnifiedAuthContainer({
  className,
  position = 'right',
  onAuthChange,
  authHook = useAuthDropdown
}: UnifiedAuthContainerProps) {
  // Position classes
  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  // Use the auth dropdown hook
  const {
    isAuthenticated,
    user,
    isDropdownOpen,
    dropdownRef,
    buttonRef,
    handleLoginClick,
    handleLogoutClick,
    toggleDropdown,
    handleKeyDown
  } = authHook(onAuthChange);

  return (
    <UnifiedAuthPresentation
      isAuthenticated={isAuthenticated}
      username={user?.username}
      isAdmin={user?.role === 'admin'}
      isDropdownOpen={isDropdownOpen}
      dropdownRef={dropdownRef}
      buttonRef={buttonRef}
      positionClass={positionClasses[position]}
      className={className}
      onLoginClick={handleLoginClick}
      onLogoutClick={handleLogoutClick}
      onToggleDropdown={toggleDropdown}
      onKeyDown={handleKeyDown}
    />
  );
}
