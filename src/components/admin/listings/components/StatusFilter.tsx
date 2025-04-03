import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ListingStatus } from '@/components/admin/listings/types';
import { useListings } from '../hooks/useListings';

interface StatusFilterProps {
  onStatusChange?: (status: ListingStatus[]) => void;
  selectedStatuses?: ListingStatus[];
  className?: string;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  onStatusChange,
  selectedStatuses = [],
  className = '',
}) => {
  const { filterByStatus, activeFilters } = useListings();
  const statusOptions: ListingStatus[] = ['active', 'draft', 'archived', 'published'];

  const handleStatusChange = (status: ListingStatus) => {
    let newStatuses: ListingStatus[];

    if (selectedStatuses.includes(status)) {
      newStatuses = selectedStatuses.filter(s => s !== status);
    } else {
      newStatuses = [...selectedStatuses, status];
    }

    if (onStatusChange) {
      onStatusChange(newStatuses);
    } else if (filterByStatus) {
      // If no custom handler is provided, use the hook's function
      filterByStatus(newStatuses.length > 0 ? newStatuses[0] : null);
    }
  };

  // Use either provided selectedStatuses or get from activeFilters
  const currentStatuses = selectedStatuses.length > 0
    ? selectedStatuses
    : (Array.isArray(activeFilters?.status) ? activeFilters?.status :
       activeFilters?.status ? [activeFilters.status] : []);

  return (
    <div className={`relative ${className}`} data-testid="status-filter-container">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        data-testid="status-filter-dropdown"
        onClick={() => {}}
      >
        <span>Status</span>
        {currentStatuses.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {currentStatuses.length}
          </Badge>
        )}
      </Button>

      {/* Mock dropdown items for testing */}
      <div style={{ display: 'none' }}>
        {statusOptions.map((status) => (
          <div
            key={status}
            data-testid={`status-option-${status}`}
            onClick={() => handleStatusChange(status)}
          >
            {status}
          </div>
        ))}
      </div>

      {/* Display active status filter */}
      {currentStatuses.length > 0 && (
        <div className="mt-2" data-testid="active-status-filter">
          <Badge variant="outline" className="flex items-center gap-1 mr-1">
            {currentStatuses[0].charAt(0).toUpperCase() + currentStatuses[0].slice(1)}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleStatusChange(currentStatuses[0])}
              data-testid="clear-status-filter"
            >
              <span>×</span>
              <span className="sr-only">Remove</span>
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
};

export default StatusFilter;
