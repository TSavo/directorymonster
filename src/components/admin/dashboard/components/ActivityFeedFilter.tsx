"use client";

import React, { useState } from 'react';
import { ActivityItem } from '../types';
import FilterButton from './FilterButton';
import FilterDropdown from './FilterDropdown';
import FilterCheckboxGroup, { CheckboxOption } from './FilterCheckboxGroup';
import FilterActions from './FilterActions';

export interface ActivityFilter {
  entityType?: ActivityItem['entityType'][];
  actionType?: ActivityItem['type'][];
  userId?: string;
}

interface ActivityFeedFilterProps {
  onApplyFilter: (filter: ActivityFilter) => void;
  initialFilter?: ActivityFilter;
  className?: string;
}

// Define the filter options
const entityTypeOptions: CheckboxOption<ActivityItem['entityType']>[] = [
  { value: 'listing', label: 'Listings' },
  { value: 'category', label: 'Categories' },
  { value: 'site', label: 'Sites' },
  { value: 'user', label: 'Users' },
  { value: 'comment', label: 'Comments' },
];

const actionTypeOptions: CheckboxOption<ActivityItem['type']>[] = [
  { value: 'creation', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'deletion', label: 'Deleted' },
  { value: 'publication', label: 'Published' },
  { value: 'import', label: 'Imported' },
];

export function ActivityFeedFilter({
  onApplyFilter,
  initialFilter = {},
  className = '',
}: ActivityFeedFilterProps) {
  // Initialize state with initial filter values
  const [entityTypes, setEntityTypes] = useState<ActivityItem['entityType'][]>(
    initialFilter.entityType || []
  );
  
  const [actionTypes, setActionTypes] = useState<ActivityItem['type'][]>(
    initialFilter.actionType || []
  );
  
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = entityTypes.length + actionTypes.length;

  // Toggle filter dropdown
  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Apply filter
  const applyFilter = () => {
    const filter: ActivityFilter = {};
    
    if (entityTypes.length > 0) {
      filter.entityType = entityTypes;
    }
    
    if (actionTypes.length > 0) {
      filter.actionType = actionTypes;
    }
    
    onApplyFilter(filter);
    setIsOpen(false);
  };

  // Clear filter
  const clearFilter = () => {
    setEntityTypes([]);
    setActionTypes([]);
    onApplyFilter({});
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} data-testid="activity-feed-filter">
      <FilterButton 
        onClick={toggleFilter} 
        activeFiltersCount={activeFiltersCount}
        isOpen={isOpen} 
      />
      
      <FilterDropdown isOpen={isOpen} onClose={closeDropdown}>
        <div>
          <FilterCheckboxGroup
            title="Entity Type"
            options={entityTypeOptions}
            selectedValues={entityTypes}
            onChange={setEntityTypes}
          />
          
          <FilterCheckboxGroup
            title="Action Type"
            options={actionTypeOptions}
            selectedValues={actionTypes}
            onChange={setActionTypes}
          />
          
          <FilterActions
            onApply={applyFilter}
            onClear={clearFilter}
            disabled={entityTypes.length === 0 && actionTypes.length === 0}
          />
        </div>
      </FilterDropdown>
    </div>
  );
}

export default ActivityFeedFilter;