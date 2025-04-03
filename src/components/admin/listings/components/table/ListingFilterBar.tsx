import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterIcon, SearchIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Category, ListingStatus } from '@/components/admin/listings/types';
import { useListings } from '../../hooks/useListings';

interface ListingFilterBarProps {
  children?: React.ReactNode;
}

export const ListingFilterBar: React.FC<ListingFilterBarProps> = ({
  children
}) => {
  const { clearFilters, activeFilters } = useListings();

  // Count active filters
  const activeFilterCount = Object.values(activeFilters || {}).filter(Boolean).length;

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center" data-testid="listing-filter-bar">
      {children}
    </div>
  );
};

export default ListingFilterBar;