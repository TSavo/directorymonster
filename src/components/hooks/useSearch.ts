'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UseSearchOptions {
  siteId: string;
  initialSearchTerm?: string;
}

export interface UseSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
}

export function useSearch({ siteId, initialSearchTerm = '' }: UseSearchOptions): UseSearchResult {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(searchTerm)}&site=${siteId}`);
    }
  }, [searchTerm, siteId, router]);

  return {
    searchTerm,
    setSearchTerm,
    handleSearch,
    isSearching
  };
}
