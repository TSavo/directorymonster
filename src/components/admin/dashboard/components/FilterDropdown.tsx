"use client";

import React, { useRef, useEffect } from 'react';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FilterDropdown({
  isOpen,
  onClose,
  children,
  className = '',
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 ${className}`}
      data-testid="filter-dropdown"
    >
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export default FilterDropdown;