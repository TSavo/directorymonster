'use client';

import React from 'react';
import { MenuIcon } from '../icons';
import { Button } from '@/components/ui/Button';

export interface MobileMenuButtonPresentationProps {
  // Handlers
  handleClick: () => void;

  // Accessibility
  ariaLabel: string;
}

/**
 * MobileMenuButtonPresentation Component
 *
 * Pure UI component for rendering the mobile menu button
 */
export function MobileMenuButtonPresentation({
  handleClick,
  ariaLabel
}: MobileMenuButtonPresentationProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="md:hidden inline-flex items-center justify-center p-2 text-foreground/70 hover:text-foreground hover:bg-background"
      onClick={handleClick}
      aria-label={ariaLabel}
      data-testid="mobile-menu-button"
    >
      <MenuIcon className="block h-6 w-6" />
    </Button>
  );
}
