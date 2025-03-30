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
import { CategoryFilterTree } from './CategoryFilterTree';

interface ListingFilterBarProps {
  categories: Category[];
  activeFilters: {
    search?: string;
    status?: ListingStatus[];
    categoryIds?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  onFilterChange: (filters: any) => void;
}

const ListingFilterBar: React.FC<ListingFilterBarProps> = ({
  categories,
  activeFilters,
  onFilterChange,
}) => {
  const statusOptions: ListingStatus[] = ['active', 'draft', 'archived'];
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...activeFilters, search: e.target.value });
  };
  
  const handleStatusChange = (status: ListingStatus) => {
    const currentStatus = activeFilters.status || [];
    
    if (currentStatus.includes(status)) {
      onFilterChange({
        ...activeFilters,
        status: currentStatus.filter(s => s !== status),
      });
    } else {
      onFilterChange({
        ...activeFilters,
        status: [...currentStatus, status],
      });
    }
  };
  
  const handleCategoryChange = (categoryIds: string[]) => {
    onFilterChange({
      ...activeFilters,
      categoryIds,
    });
  };
  
  const handlePriceChange = (field: 'priceMin' | 'priceMax', e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? undefined : Number(value);
    
    onFilterChange({
      ...activeFilters,
      [field]: numValue,
    });
  };
  
  const handleClearFilters = () => {
    onFilterChange({
      search: activeFilters.search,
      status: undefined,
      categoryIds: undefined,
      priceMin: undefined,
      priceMax: undefined,
    });
  };
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.status?.length) count += activeFilters.status.length;
    if (activeFilters.categoryIds?.length) count += 1; // Count all categories as one filter
    if (activeFilters.priceMin !== undefined) count += 1;
    if (activeFilters.priceMax !== undefined) count += 1;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center" data-testid="listing-filter-bar">
      {/* Search Input */}
      <div className="relative w-full md:w-auto md:flex-1">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search listings..."
          value={activeFilters.search || ''}
          onChange={handleSearchChange}
          className="pl-9 w-full"
          data-testid="listing-search-input"
        />
        {activeFilters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onFilterChange({ ...activeFilters, search: '' })}
            data-testid="clear-search-button"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 w-full md:w-auto">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex" data-testid="status-filter-button">
              <span>Status</span>
              {activeFilters.status?.length ? (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters.status.length}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={activeFilters.status?.includes(status) || false}
                onCheckedChange={() => handleStatusChange(status)}
                className="capitalize"
                data-testid={`status-option-${status}`}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Category Filter Tree Component */}
        <CategoryFilterTree
          categories={categories}
          selectedCategoryIds={activeFilters.categoryIds || []}
          onChange={handleCategoryChange}
        />
        
        {/* Price Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex"
              data-testid="price-filter-button"
            >
              <span>Price</span>
              {(activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined) && (
                <Badge variant="secondary" className="ml-2">
                  {(activeFilters.priceMin !== undefined ? 1 : 0) + 
                   (activeFilters.priceMax !== undefined ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <DropdownMenuLabel>Price Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="space-y-1">
                <label htmlFor="price-min" className="text-xs">
                  Min Price
                </label>
                <Input
                  id="price-min"
                  type="number"
                  min="0"
                  className="h-8 text-sm"
                  value={activeFilters.priceMin || ''}
                  onChange={(e) => handlePriceChange('priceMin', e)}
                  placeholder="Min"
                  data-testid="price-min-input"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="price-max" className="text-xs">
                  Max Price
                </label>
                <Input
                  id="price-max"
                  type="number"
                  min="0"
                  className="h-8 text-sm"
                  value={activeFilters.priceMax || ''}
                  onChange={(e) => handlePriceChange('priceMax', e)}
                  placeholder="Max"
                  data-testid="price-max-input"
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="hidden md:flex"
            data-testid="clear-filters-button"
          >
            <XIcon className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default ListingFilterBar;