"use client";

import React, { useRef, useEffect } from 'react';

interface FilterDropdownProps {
  isOpen?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

function FilterDropdown({
  isOpen,
  onClose,
  children,
  className = '',
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (onClose && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (isOpen === false) return null;

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full bg-white rounded-md shadow-lg z-10 ${className}`}
      data-testid="filter-dropdown"
    >
      {children}
    </div>
  );
}

export default FilterDropdown;