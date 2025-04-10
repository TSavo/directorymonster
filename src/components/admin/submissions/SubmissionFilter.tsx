"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { SubmissionFilters, SubmissionStatus } from '@/types/submission';
import { Search, X } from 'lucide-react';

interface SubmissionFilterProps {
  onFilterChange: (filters: SubmissionFilters) => void;
  initialFilters?: SubmissionFilters;
  categories?: { id: string; name: string }[];
}

export function SubmissionFilter({ 
  onFilterChange, 
  initialFilters = {}, 
  categories = [] 
}: SubmissionFilterProps) {
  const [filters, setFilters] = useState<SubmissionFilters>(initialFilters);
  const [expanded, setExpanded] = useState(false);

  // Update filters when initialFilters change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      setFilters(prev => ({ ...prev, status: undefined }));
    } else {
      setFilters(prev => ({ ...prev, status: [value as SubmissionStatus] }));
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFilters(prev => {
      const currentCategories = prev.categoryIds || [];
      
      if (checked) {
        return { ...prev, categoryIds: [...currentCategories, categoryId] };
      } else {
        return { 
          ...prev, 
          categoryIds: currentCategories.filter(id => id !== categoryId) 
        };
      }
    });
  };

  // Handle date change
  const handleDateChange = (field: 'fromDate' | 'toDate', date: Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      [field]: date ? date.toISOString().split('T')[0] : undefined 
    }));
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetFilters = {};
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Filter Submissions</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic search - always visible */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search submissions..."
              className="pl-8"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
          <Select 
            value={filters.status?.[0] || 'all'} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={SubmissionStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={SubmissionStatus.IN_REVIEW}>In Review</SelectItem>
              <SelectItem value={SubmissionStatus.CHANGES_REQUESTED}>Changes Requested</SelectItem>
              <SelectItem value={SubmissionStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={SubmissionStatus.REJECTED}>Rejected</SelectItem>
              <SelectItem value={SubmissionStatus.WITHDRAWN}>Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced filters - only visible when expanded */}
        {expanded && (
          <>
            {/* Date range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromDate">From Date</Label>
                <DatePicker
                  id="fromDate"
                  date={filters.fromDate ? new Date(filters.fromDate) : undefined}
                  onSelect={(date) => handleDateChange('fromDate', date)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">To Date</Label>
                <DatePicker
                  id="toDate"
                  date={filters.toDate ? new Date(filters.toDate) : undefined}
                  onSelect={(date) => handleDateChange('toDate', date)}
                />
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={(filters.categoryIds || []).includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category.id, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetFilters}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Reset
        </Button>
        <Button 
          size="sm"
          onClick={applyFilters}
          className="flex items-center gap-1"
        >
          <Search className="h-4 w-4" />
          Apply Filters
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SubmissionFilter;
