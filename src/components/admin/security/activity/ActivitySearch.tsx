'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ActivitySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export const ActivitySearch: React.FC<ActivitySearchProps> = ({
  searchTerm,
  onSearchChange,
  onSearch
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex space-x-2" data-testid="activity-search">
      <Input
        type="text"
        placeholder="Search by username or user ID"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1"
        data-testid="search-input"
      />
      <Button onClick={onSearch} data-testid="search-button">
        Search
      </Button>
    </div>
  );
};

export default ActivitySearch;
