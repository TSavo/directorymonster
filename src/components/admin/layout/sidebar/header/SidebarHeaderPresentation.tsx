'use client';

import React from 'react';
import Link from 'next/link';
import { CloseIcon } from '../../icons';
import { Button } from '@/components/ui/Button';

export interface SidebarHeaderPresentationProps {
  // State
  isOpen: boolean;

  // Handlers
  onClose: () => void;
}

/**
 * SidebarHeaderPresentation Component
 *
 * Pure UI component for rendering the header section of the sidebar
 */
export function SidebarHeaderPresentation({
  isOpen,
  onClose
}: SidebarHeaderPresentationProps) {
  return (
    <div className="flex items-center justify-between h-20 flex-shrink-0 px-6 border-b border-sidebar-muted/30">
      <Link href="/admin" className="font-bold text-xl text-sidebar text-gradient hover:opacity-90 transition-opacity">
        DirectoryMonster
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-sidebar-muted hover:text-sidebar rounded-full p-1 hover:bg-white/5"
        onClick={onClose}
        aria-label="Close sidebar"
        data-testid="sidebar-close-button"
      >
        <CloseIcon className="h-6 w-6" />
      </Button>
    </div>
  );
}
